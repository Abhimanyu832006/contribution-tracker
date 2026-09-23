"use client";

import { buildExpansionTransforms } from "@/lib/moduleTransitionMath";

/**
 * Shared-element expansion duration — the clicked tile's clone grows
 * from its exact grid rect to fullscreen. Runs concurrently with the
 * siblings' push-away (see ModulePush.js); both start at the same
 * instant so the two halves of the Tizen-style pattern read as one
 * motion, not a sequence.
 */
export const EXPAND_DURATION_MS = 560;

// Modest, independently-tuned content growth — noticeably larger than
// resting size by the end, far short of the outer surface's ~6-8x
// growth, so content never looks abandoned-tiny or blown-up-blurry.
const CONTENT_END_SCALE = 2.4;

/**
 * Presentational portal clone — the same visual atoms as ModuleTile
 * (icon, stat, label), positioned via transforms only, never layout.
 * The outer div is a full-viewport surface from its very first paint;
 * its initial inline transform (computed here, not applied later via
 * WAAPI) already matches the real tile's rect exactly, so there's no
 * flash of a fullscreen colored surface before the animation starts.
 */
export function ModuleTransitionClone({
  tile,
  rect,
  viewportW,
  viewportH,
  cloneRef,
  contentRef,
}) {
  const textClass = tile.textLight ? "text-[var(--color-ink-fg)]" : "text-black";
  const subTextClass = tile.textLight ? "text-[var(--color-ink-fg)]/70" : "text-black/60";

  const { outerStart, contentStart } = buildExpansionTransforms(rect, viewportW, viewportH);

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
        transform: outerStart,
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
          transform: contentStart,
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
          <p className={`text-sm font-black uppercase tracking-tight mt-0.5 ${textClass}`}>
            {tile.label}
          </p>
          <p className={`text-xs mt-0.5 truncate ${subTextClass}`}>{tile.sub || tile.statLabel}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Runs the shared-element expansion: a transform-only FLIP of the outer
 * surface (translate+scale from the tile's exact rect to fullscreen)
 * plus the content wrapper interpolating from its natural-size counter-
 * scale to a modest hero size. Both are plain 2-keyframe WAAPI
 * animations — the path is a straight-line lerp, so native easing does
 * the curve; no manual sampling needed (unlike the old circular-orbit
 * motion this replaces).
 *
 * @returns {Promise<void>} resolves once the surface animation finishes.
 *   This does NOT mean the destination is ready to reveal — that's a
 *   separate, later readiness check owned by the provider.
 */
export function runSharedElementExpansion({
  cloneEl,
  contentEl,
  rect,
  viewportW,
  viewportH,
  animationsRef,
  timeScale = 1,
}) {
  const duration = EXPAND_DURATION_MS * timeScale;
  const { outerStart, outerEnd, contentStart } = buildExpansionTransforms(rect, viewportW, viewportH);

  // A gentle "snap open" curve — quick to leave the rect, cushioned
  // settle into fullscreen, reads as a deliberate expansion rather than
  // a linear resize.
  const easing = "cubic-bezier(0.22, 1, 0.36, 1)";

  const outerAnim = cloneEl.animate(
    [{ transform: outerStart }, { transform: outerEnd }],
    { duration, easing, fill: "forwards" },
  );
  animationsRef.current.push(outerAnim);

  if (contentEl) {
    const contentAnim = contentEl.animate(
      [{ transform: contentStart }, { transform: `scale(${CONTENT_END_SCALE})` }],
      { duration, easing, fill: "forwards" },
    );
    animationsRef.current.push(contentAnim);
  }

  return outerAnim.finished.catch(() => {});
}
