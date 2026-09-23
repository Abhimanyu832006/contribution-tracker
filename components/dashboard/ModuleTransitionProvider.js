"use client";

import { createContext, useContext, useRef, useState, useCallback, useEffect, useTransition } from "react";
import { flushSync } from "react-dom";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import { computeFormationCenter, computeFormationRadius } from "@/lib/moduleOrbitMath";
import { runModuleOrbit } from "@/components/dashboard/ModuleOrbit";
import { runModuleExpansion, ModuleTransitionClone } from "@/components/dashboard/ModuleTransition";

// Temporary implementation aid — bump to ~2 while visually verifying the
// sequence, then always restore to 1 before shipping. Not a user setting.
const DEBUG_TIME_SCALE = 1;

const REVEAL_FADE_MS = 220;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

const ModuleTransitionContext = createContext(null);

export function useModuleTransition() {
  return useContext(ModuleTransitionContext);
}

/**
 * Mounted once inside AppChrome.js (NOT inside the dashboard page) so it
 * persists across the dashboard -> destination navigation — that's what
 * makes a real crossfade possible instead of a hard cut, since Next.js
 * doesn't remount this component when only the page segment swaps.
 *
 * Owns the entire lifecycle: Phase 1 orbit -> Phase 1/2 handoff -> Phase 2
 * expansion (navigation starts the instant expansion begins) -> waiting
 * for real readiness (pathname has moved on from where we started +
 * isPending===false + a couple of paint frames, treated as a safety-
 * checked heuristic, never absolute) -> reveal fade. The fullscreen clone
 * can hold indefinitely with no visual cost — understating readiness is
 * always the safe failure mode.
 */
export default function ModuleTransitionProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [active, setActive] = useState(null); // { tile, rect } | null
  const [phase, setPhase] = useState("idle"); // idle | orbiting | expanding | waiting-for-ready

  const busyRef = useRef(false);
  const animationsRef = useRef([]);
  const startPathnameRef = useRef(null);
  const cloneRef = useRef(null);
  const contentRef = useRef(null);

  const cancelAllAnimations = useCallback(() => {
    animationsRef.current.forEach((anim) => {
      try {
        anim.cancel();
      } catch {
        // already finished/cancelled — fine to ignore
      }
    });
    animationsRef.current = [];
  }, []);

  const revealDestination = useCallback(() => {
    const cloneEl = cloneRef.current;
    if (!cloneEl) {
      setActive(null);
      setPhase("idle");
      busyRef.current = false;
      return;
    }
    const fadeAnim = cloneEl.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: REVEAL_FADE_MS, easing: "ease-in", fill: "forwards" }
    );
    animationsRef.current.push(fadeAnim);
    fadeAnim.finished.catch(() => {}).then(() => {
      setActive(null);
      setPhase("idle");
      busyRef.current = false;
      animationsRef.current = [];
    });
  }, []);

  // Readiness watcher: only acts once Phase 2's expansion has visually
  // completed (phase === "waiting-for-ready"). We deliberately check
  // "pathname has moved on from where we started" rather than "pathname
  // equals our exact target" — a route can legitimately redirect
  // server-side to a different final path (e.g. /team -> /settings), and
  // treating that as "unexpected" would wrongly abort a perfectly normal
  // navigation. Combined with isPending===false and a couple of paint
  // frames, this is the best available "actually safe to reveal" signal
  // — but nothing here is an absolute guarantee; if the destination is
  // genuinely slow, this effect simply never fires and the fullscreen
  // clone holds indefinitely, which is the safe failure mode.
  useEffect(() => {
    if (phase !== "waiting-for-ready") return undefined;
    if (pathname === startPathnameRef.current) return undefined;
    if (isPending) return undefined;

    let cancelled = false;
    let raf2 = null;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (!cancelled) revealDestination();
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [phase, pathname, isPending, revealDestination]);

  useEffect(() => cancelAllAnimations, [cancelAllAnimations]);

  const beginTransition = useCallback(
    ({ tileEntries, selectedIndex, tile }) => {
      if (busyRef.current) return;

      if (prefersReducedMotion()) {
        router.push(tile.href);
        return;
      }

      busyRef.current = true;
      animationsRef.current = [];
      startPathnameRef.current = pathname;
      setPhase("orbiting");

      const rects = tileEntries.map((entry) => entry.rect);
      const pivot = computeFormationCenter(rects);
      const { radius } = computeFormationRadius(
        rects,
        window.innerWidth,
        window.innerHeight,
        tileEntries.length
      );

      runModuleOrbit({
        tileEntries,
        selectedIndex,
        pivot,
        radius,
        moduleKey: tile.key,
        animationsRef,
        timeScale: DEBUG_TIME_SCALE,
      }).then(() => {
        if (!busyRef.current) return; // aborted during orbit

        const selectedEl = tileEntries[selectedIndex].el;
        const rect = selectedEl.getBoundingClientRect();
        selectedEl.style.visibility = "hidden";

        // Synchronous commit so cloneRef/contentRef are attached before we
        // start driving them — a state update alone doesn't guarantee that.
        flushSync(() => {
          setActive({ tile, rect });
        });
        setPhase("expanding");

        // Navigation starts the INSTANT expansion begins, not after it
        // finishes — this gives the destination the full expansion
        // window (not just its tail) to load while the clone covers it.
        startTransition(() => {
          router.push(tile.href);
        });

        runModuleExpansion({
          cloneEl: cloneRef.current,
          contentEl: contentRef.current,
          rect,
          viewportW: window.innerWidth,
          viewportH: window.innerHeight,
          animationsRef,
          timeScale: DEBUG_TIME_SCALE,
        }).then(() => {
          if (!busyRef.current) return;
          setPhase("waiting-for-ready");
        });
      });
    },
    [pathname, router, startTransition]
  );

  return (
    <ModuleTransitionContext.Provider value={{ beginTransition }}>
      {children}
      {active &&
        typeof document !== "undefined" &&
        createPortal(
          <ModuleTransitionClone
            tile={active.tile}
            rect={active.rect}
            cloneRef={cloneRef}
            contentRef={contentRef}
          />,
          document.body
        )}
    </ModuleTransitionContext.Provider>
  );
}
