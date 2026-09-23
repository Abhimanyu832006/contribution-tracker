"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

// Both durations are GPU-composited (transform/opacity/top/left on a single
// fixed-position overlay) so they stay smooth regardless of what the main
// thread is doing underneath.
const OPEN_MS = 560;
const SPIN_MS = 480;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

// Applied unconditionally (mounted AND resting) so the browser always has
// `transition` registered before any transform/opacity value changes —
// setting `transition` and changing the value in the very same render can
// get silently skipped by the browser, which is what made the previous
// version jump straight to its end state instead of animating.
const tileTransition = `transform ${SPIN_MS}ms ${EASE}, opacity ${SPIN_MS}ms ${EASE}`;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function DashboardShell({ tiles, header, statStrip, bottomSection }) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeIndex, setActiveIndex] = useState(null);
  const [overlay, setOverlay] = useState(null); // { top, left, width, height, accent, textLight }
  const [expanded, setExpanded] = useState(false);
  // Per-tile { dx, dy } computed once at click time from real DOM rects —
  // plain data read during render, never a ref, so it's safe to use in JSX.
  const [tileDeltas, setTileDeltas] = useState(null);
  const tileRefs = useRef([]);
  const navigatingRef = useRef(false);

  // Guard against a stale mid-transition state ever being visible — if this
  // component instance is ever reused (e.g. browser back mid-animation),
  // reset fully whenever the route settles back on the dashboard. These are
  // already every state's default value, so on a normal fresh mount this is
  // a same-value no-op render, not an extra cascading update.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveIndex(null);
    setOverlay(null);
    setExpanded(false);
    setTileDeltas(null);
    navigatingRef.current = false;
  }, [pathname]);

  const handleTileClick = useCallback(
    (e, href, index) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      if (navigatingRef.current) {
        e.preventDefault();
        return;
      }
      if (prefersReducedMotion()) return; // instant nav, no animation

      e.preventDefault();
      const el = tileRefs.current[index];
      if (!el) {
        router.push(href);
        return;
      }
      const activeRect = el.getBoundingClientRect();
      const ax = activeRect.left + activeRect.width / 2;
      const ay = activeRect.top + activeRect.height / 2;

      // Compute each other tile's outward direction away from the clicked
      // tile, once, right now — reading refs is safe here (an event
      // handler), just not during render.
      const deltas = tiles.map((_, i) => {
        if (i === index) return { dx: 0, dy: 0 };
        const other = tileRefs.current[i];
        if (!other) return { dx: 0, dy: 0 };
        const r = other.getBoundingClientRect();
        const tx = r.left + r.width / 2;
        const ty = r.top + r.height / 2;
        const len = Math.hypot(tx - ax, ty - ay) || 1;
        return { dx: ((tx - ax) / len) * 140, dy: ((ty - ay) / len) * 140 };
      });

      navigatingRef.current = true;
      router.prefetch(href);
      setTileDeltas(deltas);
      setOverlay({
        top: activeRect.top,
        left: activeRect.left,
        width: activeRect.width,
        height: activeRect.height,
        accent: tiles[index].accent,
        textLight: !!tiles[index].textLight,
      });
      setActiveIndex(index);

      // Double rAF: guarantees the browser has painted the overlay at the
      // tile's exact starting rect at least once before we flip it to
      // full-screen, so the transition has a real "from" state to animate.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setExpanded(true));
      });

      window.setTimeout(() => router.push(href), OPEN_MS);
    },
    [router, tiles]
  );

  const transitioning = activeIndex !== null;

  return (
    <div className="min-h-screen overflow-hidden">
      <div
        style={{
          transition: `opacity ${SPIN_MS}ms ${EASE}, filter ${SPIN_MS}ms ${EASE}`,
          opacity: transitioning ? 0 : 1,
          filter: transitioning ? "blur(4px)" : "none",
        }}
      >
        {header}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 pb-16">
        <div
          style={{
            transition: `opacity ${SPIN_MS}ms ${EASE}, filter ${SPIN_MS}ms ${EASE}`,
            opacity: transitioning ? 0 : 1,
            filter: transitioning ? "blur(4px)" : "none",
          }}
        >
          {statStrip}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 auto-rows-[140px] sm:auto-rows-[160px] gap-3 sm:gap-4 stagger-children">
          {tiles.map((tile, i) => {
            const isActive = activeIndex === i;
            const isOther = transitioning && !isActive;

            let transform = "none";
            let opacity = 1;

            if (isActive) {
              // The overlay sits exactly on top of this tile and grows to
              // fill the screen — the real tile just needs to duck out of
              // the way the instant the overlay covers it.
              opacity = 0;
            } else if (isOther) {
              // Radial "explode + spin" away from the clicked tile, using
              // the direction vectors captured at click time.
              const { dx, dy } = tileDeltas?.[i] || { dx: 0, dy: 0 };
              const spinDeg = (i % 2 === 0 ? 1 : -1) * (540 + i * 60);
              transform = `translate(${dx}px, ${dy}px) rotate(${spinDeg}deg) scale(0.1)`;
              opacity = 0;
            }

            return (
              <Link
                key={tile.href}
                ref={(el) => {
                  tileRefs.current[i] = el;
                }}
                href={tile.href}
                onClick={(e) => handleTileClick(e, tile.href, i)}
                className={`brutal-tile overflow-hidden flex flex-col justify-between p-4 sm:p-5 ${tile.big}`}
                style={{
                  background: tile.accent,
                  transform,
                  opacity,
                  transition: tileTransition,
                  transitionDelay: isOther ? `${i * 20}ms` : "0ms",
                  willChange: "transform, opacity",
                }}
              >
                <div className="flex items-center justify-between">
                  <svg
                    className={`w-6 h-6 sm:w-7 sm:h-7 ${tile.textLight ? "text-white" : "text-black"}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.75}
                  >
                    {tile.icon}
                  </svg>
                  <svg
                    className={`w-4 h-4 ${tile.textLight ? "text-white/60" : "text-black/40"}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
                <div>
                  {tile.stat !== null && (
                    <p className={`stat-num text-3xl sm:text-4xl ${tile.textLight ? "text-white" : "text-black"}`}>
                      {tile.stat}
                    </p>
                  )}
                  <p className={`text-sm font-black uppercase tracking-tight mt-0.5 ${tile.textLight ? "text-white" : "text-black"}`}>
                    {tile.label}
                  </p>
                  <p className={`text-xs mt-0.5 truncate ${tile.textLight ? "text-white/70" : "text-black/60"}`}>
                    {tile.sub || tile.statLabel}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        <div
          style={{
            transition: `opacity ${SPIN_MS}ms ${EASE}, filter ${SPIN_MS}ms ${EASE}`,
            opacity: transitioning ? 0 : 1,
            filter: transitioning ? "blur(4px)" : "none",
          }}
        >
          {bottomSection}
        </div>
      </div>

      {overlay && (
        <div
          aria-hidden
          style={{
            position: "fixed",
            top: expanded ? 0 : overlay.top,
            left: expanded ? 0 : overlay.left,
            width: expanded ? "100vw" : overlay.width,
            height: expanded ? "100vh" : overlay.height,
            background: overlay.accent,
            zIndex: 100,
            transition: `top ${OPEN_MS}ms ${EASE}, left ${OPEN_MS}ms ${EASE}, width ${OPEN_MS}ms ${EASE}, height ${OPEN_MS}ms ${EASE}`,
            willChange: "top, left, width, height",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            className="animate-spin"
            style={{
              width: 28,
              height: 28,
              borderRadius: "9999px",
              border: `3px solid ${overlay.textLight ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.2)"}`,
              borderTopColor: overlay.textLight ? "#fff" : "#111",
              opacity: expanded ? 1 : 0,
              transition: `opacity 200ms ease ${OPEN_MS - 150}ms`,
            }}
          />
        </div>
      )}
    </div>
  );
}
