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
import { runSiblingPush } from "@/components/dashboard/ModulePush";
import {
  ModuleTransitionClone,
  runSharedElementExpansion,
} from "@/components/dashboard/ModuleTransition";

/**
 * Temporary implementation aid — bump to ~3 while visually verifying the
 * sequence, always restore to 1 before shipping. Not a user setting.
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
 * Owns a "Contextual Grid Parting with In-Place Fade Expansion"
 * transition (not a spinner/orbit, not a punchy full-screen blast): the
 * instant a tile is clicked —
 *   1. the real tile is hidden and a portal clone is mounted at its
 *      exact rect in the same synchronous commit (no visible jump);
 *   2. the clone (the anchor) grows in place to fill the screen with a
 *      soft, longer, near-linear curve — graceful, not a snap — while
 *      every other tile simultaneously parts away radially from the
 *      anchor's center, shrinking and fading to 0 opacity on a quicker,
 *      snappier curve (ModulePush.js) — both start together but at
 *      deliberately different paces;
 *   3. navigation fires immediately, inside startTransition, so the
 *      destination has the entire expansion window (and however long
 *      it needs afterward) to load underneath the still-fullscreen
 *      clone;
 *   4. once expansion finishes, a readiness watcher waits for real
 *      safety (pathname has moved on from where we started + isPending
 *      === false + a couple of paint frames — treated as a heuristic,
 *      never an absolute guarantee) before fading the clone. If the
 *      destination is slow, the clone holds indefinitely with no
 *      visual cost — never a blank screen, never a spinner.
 */
export default function ModuleTransitionProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // `active`: the clone's { tile, rect, viewportW, viewportH }, or null
  //           when no transition running
  const [active, setActive] = useState(null);
  // `phase`: idle | running | waiting-for-ready
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

  // Readiness watcher: only acts once the expansion has visually
  // completed (phase === "waiting-for-ready"). Checks pathname-moved-on
  // rather than pathname-equals-target so server-side redirects (e.g.
  // /team -> /settings) are handled correctly. Combined with
  // isPending===false and a couple of paint frames — but nothing here is
  // an absolute guarantee; if the destination is genuinely slow, this
  // effect simply never fires and the fullscreen clone holds
  // indefinitely, which is the safe failure mode.
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

      const selectedRect = tileEntries[selectedIndex].rect;
      const pivot = {
        x: selectedRect.left + selectedRect.width / 2,
        y: selectedRect.top + selectedRect.height / 2,
      };
      const selectedEl = tileEntries[selectedIndex].el;

      // Hide the real selected tile and mount the clone in the SAME
      // synchronous commit — no frame where either both or neither is
      // visible. The clone's very first paint is pixel-identical to the
      // real tile (same accent, same layout, positioned at the same
      // rect via its initial inline transform).
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
      setPhase("running");

      // Both halves of the pattern start in the same tick: the clicked
      // tile's shared-element expansion and its siblings' push-away.
      runSiblingPush({
        tileEntries,
        selectedIndex,
        pivot,
        viewportW: window.innerWidth,
        viewportH: window.innerHeight,
        animationsRef,
        timeScale: DEBUG_TIME_SCALE,
      });

      // Navigation fires immediately, alongside the expansion — this
      // gives the destination the entire expansion window (not just its
      // tail) to load while the clone visually covers it.
      startTransition(() => {
        router.push(tile.href);
      });

      runSharedElementExpansion({
        cloneEl: cloneRef.current,
        contentEl: contentRef.current,
        rect: selectedRect,
        viewportW: window.innerWidth,
        viewportH: window.innerHeight,
        animationsRef,
        timeScale: DEBUG_TIME_SCALE,
      }).then(() => {
        if (!busyRef.current) return;
        setPhase("waiting-for-ready");
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
