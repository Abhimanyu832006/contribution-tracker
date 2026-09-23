"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

// GPU-composited (transform/opacity only) so it stays smooth regardless of
// what the main thread is doing underneath — this is what actually hides
// the DB round trip: the route is prefetched the instant the click fires,
// so the real page is usually already resolved by the time this finishes.
const DURATION_MS = 520;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

// Applied unconditionally (mounted AND resting) so the browser always has
// `transition` registered before transform/opacity change — adding
// `transition` and changing the value in the same render can get silently
// skipped, which is what caused the animation to sometimes not play at all.
const tileTransition = `transform ${DURATION_MS}ms ${EASE}, opacity ${DURATION_MS}ms ${EASE}`;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Wraps the dashboard's header/stat-strip/tile-grid/bottom-section. On tile
 * click: the clicked module fades away in place, the surrounding modules
 * spin, and the destination route is prefetched immediately — the spin is
 * what hides the fetch, so there's no separate loading skeleton underneath.
 */
export default function DashboardShell({ tiles, header, statStrip, bottomSection }) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeIndex, setActiveIndex] = useState(null);

  // Guard against a stale mid-transition state ever being visible if this
  // component instance is ever reused (e.g. browser back mid-animation).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveIndex(null);
  }, [pathname]);

  const handleTileClick = useCallback(
    (e, href, index) => {
      // Let modifier-clicks (new tab / new window) and middle-click behave normally.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      if (activeIndex !== null) {
        e.preventDefault();
        return;
      }
      if (prefersReducedMotion()) return; // instant nav, no animation

      e.preventDefault();
      router.prefetch(href);
      setActiveIndex(index);
      window.setTimeout(() => router.push(href), DURATION_MS);
    },
    [router, activeIndex]
  );

  const transitioning = activeIndex !== null;

  const fadeStyle = {
    transition: `opacity ${DURATION_MS}ms ${EASE}, filter ${DURATION_MS}ms ${EASE}`,
    opacity: transitioning ? 0 : 1,
    filter: transitioning ? "blur(4px)" : "none",
  };

  return (
    <div className="min-h-screen overflow-hidden">
      <div style={fadeStyle}>{header}</div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 pb-16">
        <div style={fadeStyle}>{statStrip}</div>

        <div className="grid grid-cols-2 sm:grid-cols-3 auto-rows-[140px] sm:auto-rows-[160px] gap-3 sm:gap-4 stagger-children">
          {tiles.map((tile, i) => {
            const isActive = activeIndex === i;
            const isOther = transitioning && !isActive;

            let transform = "none";
            let opacity = 1;

            if (isActive) {
              // The clicked module simply fades away in place.
              transform = "scale(0.92)";
              opacity = 0;
            } else if (isOther) {
              // Everything else spins — a full rotation (direction
              // alternating per tile) while shrinking and fading.
              const direction = i % 2 === 0 ? 1 : -1;
              const spinDeg = direction * (360 + i * 60);
              transform = `rotate(${spinDeg}deg) scale(0.35)`;
              opacity = 0;
            }

            return (
              <Link
                key={tile.href}
                href={tile.href}
                onClick={(e) => handleTileClick(e, tile.href, i)}
                className={`brutal-tile overflow-hidden flex flex-col justify-between p-4 sm:p-5 ${tile.big}`}
                style={{
                  background: tile.accent,
                  transform,
                  opacity,
                  transition: tileTransition,
                  transitionDelay: isOther ? `${i * 25}ms` : "0ms",
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

        <div style={fadeStyle}>{bottomSection}</div>
      </div>
    </div>
  );
}
