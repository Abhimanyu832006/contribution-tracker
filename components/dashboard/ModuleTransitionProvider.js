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
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import { ModuleLoadingOverlay } from "@/components/dashboard/ModuleLoadingOverlay";

/**
 * Floor on how long the loading overlay stays up, even if the
 * destination is already ready (e.g. a prefetched route resolving
 * near-instantly). Without this, a fast navigation would flash the
 * overlay on and immediately off — a genuine loading indicator needs to
 * be perceivable, not just technically correct.
 */
const MIN_DISPLAY_MS = 450;

const REVEAL_FADE_MS = 200;

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
 * lets the overlay survive the actual page swap instead of disappearing
 * the instant the old page unmounts.
 *
 * Model: a plain neo-brutalist loading screen, not a shared-element
 * illusion. The instant a tile is clicked:
 *   1. a full-screen overlay (icon + label + a sweeping loading bar,
 *      ModuleLoadingOverlay.js) mounts immediately, covering the
 *      dashboard;
 *   2. navigation fires immediately, inside startTransition, so the
 *      destination loads underneath while the overlay is up;
 *   3. once BOTH a minimum display time has elapsed (so the loader
 *      never just flashes on fast/prefetched navigations) AND real
 *      readiness is confirmed (pathname has moved on from where we
 *      started + isPending === false + a couple of paint frames —
 *      treated as a heuristic, never an absolute guarantee), the
 *      overlay fades out. If the destination is slow, it simply holds
 *      past the minimum with no visual cost — never a blank screen.
 */
export default function ModuleTransitionProvider({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [active, setActive] = useState(null); // { tile } | null
  const [phase, setPhase] = useState("idle"); // idle | waiting-for-ready

  const busyRef = useRef(false);
  const startPathnameRef = useRef(null);
  const shownAtRef = useRef(0);
  const overlayRef = useRef(null);

  const revealDestination = useCallback(() => {
    const el = overlayRef.current;
    if (!el) {
      setActive(null);
      setPhase("idle");
      busyRef.current = false;
      return;
    }
    const fadeAnim = el.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: REVEAL_FADE_MS, easing: "ease-in", fill: "forwards" },
    );
    fadeAnim.finished.catch(() => {}).then(() => {
      setActive(null);
      setPhase("idle");
      busyRef.current = false;
    });
  }, []);

  // Readiness watcher: checks pathname-moved-on rather than pathname-
  // equals-target so server-side redirects (e.g. /team -> /settings)
  // are handled correctly, combined with isPending===false, a couple of
  // paint frames, AND the minimum display floor above. Nothing here is
  // an absolute guarantee; if the destination is genuinely slow, this
  // effect simply keeps returning early and the overlay holds
  // indefinitely, which is the safe failure mode.
  useEffect(() => {
    if (phase !== "waiting-for-ready") return undefined;
    if (pathname === startPathnameRef.current) return undefined;
    if (isPending) return undefined;

    let cancelled = false;
    let raf1 = null;
    let raf2 = null;
    let timeoutId = null;

    const confirmPaintThenReveal = () => {
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => {
          if (!cancelled) revealDestination();
        });
      });
    };

    const remaining = MIN_DISPLAY_MS - (Date.now() - shownAtRef.current);
    if (remaining > 0) {
      timeoutId = setTimeout(() => {
        if (!cancelled) confirmPaintThenReveal();
      }, remaining);
    } else {
      confirmPaintThenReveal();
    }

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (raf1) cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [phase, pathname, isPending, revealDestination]);

  const beginTransition = useCallback(
    ({ tile }) => {
      if (busyRef.current) return;

      if (prefersReducedMotion()) {
        router.push(tile.href);
        return;
      }

      busyRef.current = true;
      startPathnameRef.current = pathname;
      shownAtRef.current = Date.now();

      setActive({ tile });
      setPhase("waiting-for-ready");

      // Navigation fires immediately, alongside the overlay mounting —
      // the destination gets the full loading-screen window to load.
      startTransition(() => {
        router.push(tile.href);
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
          <ModuleLoadingOverlay tile={active.tile} overlayRef={overlayRef} />,
          document.body,
        )}
    </ModuleTransitionContext.Provider>
  );
}
