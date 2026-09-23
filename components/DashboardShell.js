"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Both durations are GPU-composited (transform/opacity only) so they stay
// smooth regardless of what's happening on the main thread underneath.
const ACTIVE_MS = 620;
const OTHER_MS = 460;
const EASE_OUT = "cubic-bezier(0.16, 1, 0.3, 1)";
const EASE_SPIN = "cubic-bezier(0.4, 0, 0.2, 1)";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Wraps the dashboard's header/stat-strip/tile-grid/bottom-section so a tile
 * click can play a full transition instead of a flat route swap: the other
 * tiles spin outward and fade while the chosen one scales up from its own
 * center. The destination route is prefetched the instant the click fires,
 * so by the time the animation finishes the real page is already resolved —
 * the animation's job is to hide that ~300ms fetch, not just look nice.
 */
export default function DashboardShell({ tiles, header, statStrip, bottomSection }) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(null);
  const navigatingRef = useRef(false);

  const handleTileClick = useCallback(
    (e, href, index) => {
      // Let modifier-clicks (new tab / new window) and middle-click behave normally.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      if (navigatingRef.current) {
        e.preventDefault();
        return;
      }
      if (prefersReducedMotion()) return; // instant nav, no animation

      e.preventDefault();
      navigatingRef.current = true;
      router.prefetch(href);
      setActiveIndex(index);
      window.setTimeout(() => {
        router.push(href);
      }, ACTIVE_MS);
    },
    [router]
  );

  const transitioning = activeIndex !== null;

  const fadeStyle = (extra = {}) => ({
    transition: `opacity ${OTHER_MS}ms ${EASE_OUT}, filter ${OTHER_MS}ms ${EASE_OUT}, transform ${OTHER_MS}ms ${EASE_OUT}`,
    opacity: transitioning ? 0 : 1,
    filter: transitioning ? "blur(6px)" : "none",
    willChange: "opacity, filter, transform",
    ...extra,
  });

  return (
    <div className="min-h-screen overflow-hidden">
      <div style={fadeStyle()}>{header}</div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 pb-16">
        <div style={fadeStyle()}>{statStrip}</div>

        <div className="grid grid-cols-2 sm:grid-cols-3 auto-rows-[140px] sm:auto-rows-[160px] gap-3 sm:gap-4 stagger-children">
          {tiles.map((tile, i) => {
            const isActive = activeIndex === i;
            const direction = i % 2 === 0 ? 1 : -1;
            const spinDeg = direction * (360 + i * 45);

            let tileStyle = {
              background: tile.accent,
              position: "relative",
              willChange: "transform, opacity",
            };

            if (transitioning) {
              if (isActive) {
                tileStyle = {
                  ...tileStyle,
                  transform: "scale(16)",
                  transition: `transform ${ACTIVE_MS}ms ${EASE_OUT}`,
                  zIndex: 50,
                };
              } else {
                tileStyle = {
                  ...tileStyle,
                  transform: `rotate(${spinDeg}deg) scale(0.1)`,
                  opacity: 0,
                  transition: `transform ${OTHER_MS}ms ${EASE_SPIN} ${i * 25}ms, opacity ${OTHER_MS}ms ease ${i * 25}ms`,
                };
              }
            } else {
              tileStyle = { ...tileStyle, transform: "none", opacity: 1 };
            }

            return (
              <Link
                key={tile.href}
                href={tile.href}
                onClick={(e) => handleTileClick(e, tile.href, i)}
                className={`brutal-tile overflow-hidden flex flex-col justify-between p-4 sm:p-5 ${tile.big}`}
                style={tileStyle}
              >
                <div
                  style={{
                    transition: `opacity ${isActive ? 140 : OTHER_MS}ms ease`,
                    opacity: isActive ? 0 : 1,
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
                </div>
              </Link>
            );
          })}
        </div>

        <div style={fadeStyle()}>{bottomSection}</div>
      </div>
    </div>
  );
}
