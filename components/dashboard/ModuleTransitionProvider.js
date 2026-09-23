"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
  useTransition,
} from "react";
import { flushSync } from "react-dom";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import {
  computeFormationCenter,
  computeFormationRadius,
  assignFormationAngles,
} from "@/lib/moduleOrbitMath";
import { runNonSelectedMorph } from "@/components/dashboard/ModuleOrbit";
import {
  ModuleTransitionClone,
  runSelectedPreMax,
  runMaximizeExpansion,
} from "@/components/dashboard/ModuleTransition";

/**
 * Temporary implementation aid — bump to ~2-3 while visually verifying
 * the sequence, always restore to 1 before shipping. Not a user setting.
 */
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
 * persists across the dashboard → destination navigation — that's what
 * makes a real crossfade possible instead of a hard cut, since Next.js
 * doesn't remount this component when only the page segment swaps.
 *
 * Owns the entire transition lifecycle as ONE continuous morph — not
 * discrete phases with a swap-to-clone mid-flight. The moment the user
 * clicks a tile:
 *   1. hide the real tile & mount a portal clone at its exact rect (both
 *      in the same synchronous commit — no visible jump between "real
 *      tile shown" and "clone shown");
 *   2. run BOTH the non-selected tiles' compress→orbit→fade AND the
 *      selected clone's compress→orbit→emerge in parallel (they share
 *      duration & stage fractions, so all six cards read as ONE moving
 *      formation until the split at the very end);
 *   3. the instant the pre-max morph ends, fire `router.push()` inside
 *      startTransition (so the current tree stays mounted / we can watch
 *      isPending) AND kick off the maximize expansion — navigation and
 *      genie-max begin together, giving the destination the full ~560ms
 *      maximize window to load underneath a still-fullscreen-covered
 *      clone;
 *   4. wait for real readiness (pathname has moved on from where we
 *      started + isPending===false + a couple of paint frames, treated as
 *      a safety-checked heuristic, never absolute) before fading the
 *      clone. If the destination is slow, the clone holds indefinitely
 *      with no visual cost — never a blank screen, never a spinner.
 */
export default function ModuleTransitionProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // `active`: the clone's { tile, rect, viewportW, viewportH }, or null
  //           when no transition running
  const [active, setActive] = useState(null);
  // `phase`: "idle" | "morphing" | "maximizing" | "waiting-for-ready"
  const [phase, setPhase] = useState("idle");

  const busyRef = useRef(false);
  const animationsRef = useRef([]);
  const startPathnameRef = useRef(null);
  const hiddenTileRef = useRef(null); // real tile hidden while clone is up
  const cloneRef = useRef(null);
  const contentRef = useRef(null);

  const cancelAllAnimations = useCallback(() => {
    animationsRef.current.forEach((anim) => {
      try {
        anim.cancel();
      } catch {
        // already finished/cancelled — fine
      }
    });
    animationsRef.current = [];
  }, []);

  const restoreHiddenTile = useCallback(() => {
    const el = hiddenTileRef.current;
    if (el) {
      try {
        el.style.visibility = "";
      } catch {
        // element may have been detached by a page unmount — fine
      }
      hiddenTileRef.current = null;
    }
  }, []);

  const revealDestination = useCallback(() => {
    const cloneEl = cloneRef.current;
    if (!cloneEl) {
      setActive(null);
      setPhase("idle");
      busyRef.current = false;
      restoreHiddenTile();
      return;
    }
    const fadeAnim = cloneEl.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: REVEAL_FADE_MS, easing: "ease-in", fill: "forwards" },
    );
    animationsRef.current.push(fadeAnim);
    fadeAnim.finished.catch(() => {}).then(() => {
      setActive(null);
      setPhase("idle");
      busyRef.current = false;
      animationsRef.current = [];
      restoreHiddenTile();
    });
  }, [restoreHiddenTile]);

  // Readiness watcher: only acts once maximize has visually completed
  // (phase === "waiting-for-ready"). Checks pathname-moved-on rather than
  // pathname-equals-target so server-side redirects (e.g. /team →
  // /settings) are handled correctly. Combined with isPending===false and
  // a couple of paint frames — but nothing here is an absolute guarantee;
  // if the destination is genuinely slow, this effect simply never fires
  // and the fullscreen clone holds indefinitely, which is the safe
  // failure mode.
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

      const rects = tileEntries.map((entry) => entry.rect);
      const pivot = computeFormationCenter(rects);
      const { radius, scale: formationScale } = computeFormationRadius(
        rects,
        window.innerWidth,
        window.innerHeight,
        tileEntries.length,
      );
      const { targetAngles } = assignFormationAngles(rects, pivot);

      // Per-tile scale: each tile shrinks to the same visual footprint on
      // the formation circle regardless of its resting bento-grid size,
      // so the big col-span-2 Contributions tile doesn't overlap its
      // neighbors. `formationScale` is what the reference tile shrinks
      // to; a bigger-than-reference tile scales tighter in proportion.
      const diagonals = rects.map((r) => Math.hypot(r.width, r.height)).sort((a, b) => a - b);
      const rRef = diagonals[Math.max(0, Math.floor(diagonals.length * 0.7))] / 2;
      const perTileScale = rects.map((r) => {
        const d = Math.hypot(r.width, r.height) / 2;
        return Math.min(formationScale, (formationScale * rRef) / d);
      });

      const selectedRect = rects[selectedIndex];
      const selectedEl = tileEntries[selectedIndex].el;
      const cx0 = selectedRect.left + selectedRect.width / 2;
      const cy0 = selectedRect.top + selectedRect.height / 2;
      const angle0 = Math.atan2(cy0 - pivot.y, cx0 - pivot.x);
      const radius0 = Math.hypot(cx0 - pivot.x, cy0 - pivot.y) || 1;

      // Hide the real selected tile and mount the clone in the SAME
      // synchronous commit — no frame where either both or neither is
      // visible. The clone at its very first paint is pixel-identical to
      // the real tile (same accent, same layout, positioned at the same
      // rect via its initial outer transform + counter-scaled content).
      selectedEl.style.visibility = "hidden";
      hiddenTileRef.current = selectedEl;

      flushSync(() => {
        setActive({
          tile,
          rect: selectedRect,
          viewportW: window.innerWidth,
          viewportH: window.innerHeight,
        });
      });
      setPhase("morphing");

      // Kick both morphs off in the same tick — they share duration &
      // stage fractions, so all six cards look like one formation.
      const nonSelPromise = runNonSelectedMorph({
        tileEntries,
        selectedIndex,
        pivot,
        radius,
        targetAngles,
        perTileScale,
        animationsRef,
        timeScale: DEBUG_TIME_SCALE,
      });

      const { finished: preMaxFinished, emergeEndState } = runSelectedPreMax({
        cloneEl: cloneRef.current,
        contentEl: contentRef.current,
        rect: selectedRect,
        viewportW: window.innerWidth,
        viewportH: window.innerHeight,
        angle0,
        radius0,
        targetAngle: targetAngles[selectedIndex],
        radius,
        pivot,
        compressScale: perTileScale[selectedIndex],
        animationsRef,
        moduleKey: tile.key,
        timeScale: DEBUG_TIME_SCALE,
      });

      // Await BOTH the pre-max and the non-selected fade before starting
      // maximize — this is what makes the emerge feel like "extracting
      // from the buffer" rather than "leaving the others behind mid-
      // rotation." Both are the same duration, so the wait is basically
      // one tick.
      Promise.all([preMaxFinished, nonSelPromise]).then(() => {
        if (!busyRef.current) return; // aborted during morph

        setPhase("maximizing");

        // Navigation fires the INSTANT maximize begins. `startTransition`
        // keeps the old tree mounted (so `isPending` becomes a useful
        // readiness signal) and gives the destination the entire maximize
        // window to load underneath the clone.
        startTransition(() => {
          router.push(tile.href);
        });

        runMaximizeExpansion({
          cloneEl: cloneRef.current,
          contentEl: contentRef.current,
          rect: selectedRect,
          viewportW: window.innerWidth,
          viewportH: window.innerHeight,
          emergeEndState,
          animationsRef,
          timeScale: DEBUG_TIME_SCALE,
        }).then(() => {
          if (!busyRef.current) return;
          setPhase("waiting-for-ready");
        });
      });
    },
    [pathname, router, startTransition],
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
            viewportW={active.viewportW}
            viewportH={active.viewportH}
            cloneRef={cloneRef}
            contentRef={contentRef}
          />,
          document.body,
        )}
    </ModuleTransitionContext.Provider>
  );
}
