"use client";

import { buildExpansionKeyframes } from "@/lib/moduleOrbitMath";

export const PHASE2_DURATION_MS = 600;
const CONTENT_END_SCALE = 2.4; // tunable — noticeably larger than resting size by the end, far short of the surface's ~6-8x growth

/**
 * Presentational portal clone for Phase 2 — mirrors ModuleTile's icon/
 * stat/label markup (matching the user's own maximize mockup, which
 * drops the trailing arrow and sub-label line during expansion). The
 * outer div IS the full-viewport box from the very first frame (never
 * itself resized) — its `transform` is what visually shrinks it down to
 * exactly match the selected tile's captured rect, then grows back out.
 */
export function ModuleTransitionClone({ tile, rect, cloneRef, contentRef }) {
  const textClass = tile.textLight ? "text-[var(--color-ink-fg)]" : "text-black";

  return (
    <div
      ref={cloneRef}
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: tile.accent,
        transformOrigin: "0 0",
        zIndex: 9999,
        pointerEvents: "none",
        overflow: "hidden",
        willChange: "transform, opacity",
      }}
    >
      <div
        ref={contentRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: rect.width,
          height: rect.height,
          transformOrigin: "0 0",
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          willChange: "transform",
        }}
      >
        <svg
          className={`w-6 h-6 sm:w-7 sm:h-7 ${textClass}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
        >
          {tile.icon}
        </svg>
        <div>
          {tile.stat !== null && (
            <p className={`stat-num text-3xl sm:text-4xl ${textClass}`}>{tile.stat}</p>
          )}
          <p className={`text-sm font-black uppercase tracking-tight mt-0.5 ${textClass}`}>{tile.label}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Runs Phase 2: a transform-only FLIP of the outer surface (translate+
 * scale from the captured rect to fullscreen) plus an independently
 * scaled content wrapper (see buildExpansionKeyframes) — both pre-sampled
 * WAAPI animations, `easing: "linear"` between samples since the curve
 * is baked into the sample distribution.
 *
 * @returns {Promise<void>} resolves once the surface animation finishes.
 *   This does NOT mean the destination is ready to reveal — that's a
 *   separate, later readiness check owned by the provider.
 */
export function runModuleExpansion({ cloneEl, contentEl, rect, viewportW, viewportH, animationsRef, timeScale = 1 }) {
  const duration = PHASE2_DURATION_MS * timeScale;
  const { surface, content } = buildExpansionKeyframes({
    rect,
    viewportW,
    viewportH,
    contentEndScale: CONTENT_END_SCALE,
  });

  const surfaceAnim = cloneEl.animate(surface, { duration, easing: "linear", fill: "forwards" });
  animationsRef.current.push(surfaceAnim);

  if (contentEl) {
    const contentAnim = contentEl.animate(content, { duration, easing: "linear", fill: "forwards" });
    animationsRef.current.push(contentAnim);
  }

  return surfaceAnim.finished.catch(() => {});
}
