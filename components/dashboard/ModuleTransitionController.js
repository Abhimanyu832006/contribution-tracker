"use client";

import { useRef, useState, useCallback, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import ModuleGrid from "./ModuleGrid";
import { computeHeroFrame, computeOrbitFrame } from "@/lib/moduleOrbitMath";

// Suggested by spec: long enough that the orbital motion clearly reads,
// short enough to still feel responsive.
const DURATION_MS = 820;
const STAGGER_STEP_MS = 35; // organic, not mechanically synchronized
const ORBIT_RADIANS = 2.35; // ~135° of visible arc — a clear curve, not a full loop
const RADIUS_GROWTH = 3.4; // orbit radius ends ~4.4x its starting distance
const SELF_SPIN_DEG = 220; // extra own-axis spin layered on top of the orbit
const FADE_START = 0.4; // orbiting tiles hold full opacity until 40% through their own motion
const CONTENT_FADE_MS = 170; // the hero clone's own icon/label fades fast, before it visibly stretches

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Orchestrates the dashboard's module-click transition:
 *
 *  - The clicked tile's exact rect is captured, and a full-viewport
 *    portal clone is grown from that rect to fill the screen using only
 *    `transform` (translate+scale) — no width/height/top/left animation.
 *  - Every other tile orbits that clone's *current* (moving) center:
 *    each keeps its own captured angle/radius, which increases and
 *    grows over time, while the tile also spins on its own axis and
 *    fades out only in the back half of the motion.
 *  - Real navigation starts immediately (inside a React transition, so
 *    the current — still animating — tree stays mounted instead of
 *    flashing the destination's Suspense fallback) while the animation
 *    plays independently via refs/rAF, never touching React state on a
 *    per-frame basis.
 */
export default function ModuleTransitionController({ tiles, header, statStrip, bottomSection }) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  // `active` only mounts/unmounts the portal clone — it is NOT updated
  // per frame. Per-frame visuals are pushed straight to the DOM via refs.
  const [active, setActive] = useState(null); // { tile, rect } | null

  const tileElsRef = useRef([]);
  const orbitDataRef = useRef([]);
  const cloneElRef = useRef(null);
  const cloneContentRef = useRef(null);
  const rafRef = useRef(null);
  const startTsRef = useRef(null);
  const busyRef = useRef(false);

  const registerRef = useCallback((i, el) => {
    tileElsRef.current[i] = el;
  }, []);

  const resetTileStyles = useCallback(() => {
    tileElsRef.current.forEach((el) => {
      if (!el) return;
      el.style.transform = "";
      el.style.opacity = "";
      el.style.animation = "";
      el.style.willChange = "";
    });
  }, []);

  // Guard against a stale mid-transition state ever being visible if this
  // component instance is ever reused (e.g. browser back mid-animation).
  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    startTsRef.current = null;
    busyRef.current = false;
    resetTileStyles();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActive(null);
  }, [pathname, resetTileStyles]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // A plain function (not useCallback) so it can safely recurse into
  // itself via requestAnimationFrame — a `const` from useCallback can't
  // reference itself before its own declaration finishes.
  function runFrame(rect, now) {
    if (startTsRef.current === null) startTsRef.current = now;
    const elapsed = now - startTsRef.current;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const hero = computeHeroFrame(rect, elapsed, DURATION_MS, vw, vh);

    if (cloneElRef.current) {
      cloneElRef.current.style.transform = hero.transform;
    }
    if (cloneContentRef.current) {
      const contentOpacity = 1 - Math.min(1, elapsed / CONTENT_FADE_MS);
      cloneContentRef.current.style.opacity = String(contentOpacity);
    }

    const orbitOpts = {
      durationMs: DURATION_MS,
      orbitRadians: ORBIT_RADIANS,
      radiusGrowth: RADIUS_GROWTH,
      selfSpinDeg: SELF_SPIN_DEG,
      fadeStart: FADE_START,
    };

    let maxLocalT = 0;
    orbitDataRef.current.forEach((tileState) => {
      const { el, stagger } = tileState;
      if (!el) return;
      const frame = computeOrbitFrame(tileState, elapsed, hero.center, orbitOpts);
      el.style.transform = `translate(${frame.dx}px, ${frame.dy}px) rotate(${frame.spinDeg}deg) scale(${frame.scale})`;
      el.style.opacity = String(frame.opacity);
      maxLocalT = Math.max(maxLocalT, Math.max(0, elapsed - stagger) / DURATION_MS);
    });

    const stillGoing = hero.progress < 1 || maxLocalT < 1;
    if (stillGoing) {
      rafRef.current = requestAnimationFrame((t) => runFrame(rect, t));
    } else {
      rafRef.current = null;
    }
  }

  const handleTileClick = useCallback(
    (e, tile, index) => {
      // Let modifier-clicks (new tab / window) and middle-click behave normally.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      if (busyRef.current) {
        e.preventDefault();
        return;
      }
      if (prefersReducedMotion()) return; // instant nav, no animation

      e.preventDefault();
      const el = tileElsRef.current[index];
      if (!el) {
        router.push(tile.href);
        return;
      }

      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      orbitDataRef.current = tiles
        .map((_, i) => i)
        .filter((i) => i !== index)
        .map((i, orderIdx) => {
          const otherEl = tileElsRef.current[i];
          if (!otherEl) return null;
          const r = otherEl.getBoundingClientRect();
          const ocx = r.left + r.width / 2;
          const ocy = r.top + r.height / 2;
          const dx = ocx - cx;
          const dy = ocy - cy;
          // The grid's `stagger-children` mount animation applies a CSS
          // `animation` (fade-in, fill-mode: both) to every tile. A CSS
          // animation's held value takes precedence over inline styles for
          // the same properties, even after it finishes — so without this,
          // our imperative transform/opacity updates below get silently
          // masked and the tile never visibly moves. Killing it here, once,
          // right before we start driving this tile ourselves, is enough.
          otherEl.style.animation = "none";
          otherEl.style.willChange = "transform, opacity";
          return {
            el: otherEl,
            angle0: Math.atan2(dy, dx),
            radius0: Math.hypot(dx, dy) || 1,
            cx0: ocx,
            cy0: ocy,
            stagger: orderIdx * STAGGER_STEP_MS,
          };
        })
        .filter(Boolean);

      busyRef.current = true;
      startTsRef.current = null;
      setActive({ tile, rect });

      // Warm what Next.js can warm immediately (for a fully dynamic,
      // cookie-based route this only prefetches the static shell, not
      // the actual data — there's no client API to start that fetch any
      // earlier). The real navigation fires once the animation finishes
      // its full choreography, inside a transition so React keeps this
      // tree mounted instead of eagerly flashing the destination's
      // loading.js fallback during whatever gap remains.
      router.prefetch(tile.href);
      window.setTimeout(() => {
        startTransition(() => router.push(tile.href));
      }, DURATION_MS);

      rafRef.current = requestAnimationFrame((t) => runFrame(rect, t));
    },
    // runFrame is intentionally a plain per-render function, not a
    // memoized dependency: it only reads refs (always current) and the
    // `rect`/`t` values passed in explicitly, so it has no stale-closure
    // risk that including it here would actually fix.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router, tiles, startTransition]
  );

  return (
    <div className="min-h-screen overflow-hidden">
      {header}

      <div className="max-w-6xl mx-auto px-4 sm:px-8 pb-16">
        {statStrip}
        <ModuleGrid tiles={tiles} registerRef={registerRef} onTileClick={handleTileClick} />
        {bottomSection}
      </div>

      {active &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={cloneElRef}
            aria-hidden
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: active.tile.accent,
              transformOrigin: "0 0",
              zIndex: 9999,
              willChange: "transform",
              pointerEvents: "none",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "1.25rem",
              overflow: "hidden",
            }}
          >
            <div ref={cloneContentRef} style={{ willChange: "opacity" }}>
              <div className="flex items-center justify-between">
                <svg
                  className={`w-6 h-6 sm:w-7 sm:h-7 ${active.tile.textLight ? "text-white" : "text-black"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                >
                  {active.tile.icon}
                </svg>
              </div>
              <div>
                {active.tile.stat !== null && (
                  <p className={`stat-num text-3xl sm:text-4xl ${active.tile.textLight ? "text-white" : "text-black"}`}>
                    {active.tile.stat}
                  </p>
                )}
                <p className={`text-sm font-black uppercase tracking-tight mt-0.5 ${active.tile.textLight ? "text-white" : "text-black"}`}>
                  {active.tile.label}
                </p>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
