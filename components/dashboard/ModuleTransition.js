"use client";

import { buildExpansionTransforms, EXPAND_EASING } from "@/lib/moduleTransitionMath";

/**
 * The anchor tile's own expansion duration — deliberately LONGER than
 * the siblings' parting animation (see PUSH_DURATION_MS in
 * ModulePush.js). Both start in the same tick, but the anchor settles
 * in slower and softer while everyone else clears out fast — that pace
 * difference is what makes this read as "graceful focus," not a blast.
 */
export const EXPAND_DURATION_MS = 700;

// Modest, independently-tuned content growth — noticeably larger than
// resting size by the end, far short of the outer surface's ~6-8x
// growth, so content never looks abandoned-tiny or blown-up-blurry.
const CONTENT_END_SCALE = 2.4;

// Matches .brutal-tile's CSS border-radius — the clone's corners start
// here (so its very first paint is pixel-identical to the real tile)
// and shrink to 0 by the time it fills the viewport, since a fullscreen
// surface with rounded corners would look like a mistake.
const TILE_CORNER_RADIUS_PX = 20;

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

  const { outerStart, contentStart, radiusStart } = buildExpansionTransforms(
    rect,
    viewportW,
    viewportH,
    TILE_CORNER_RADIUS_PX,
  );

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
        borderRadius: radiusStart,
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
  const { outerStart, outerEnd, contentStart, radiusStart, radiusEnd } = buildExpansionTransforms(
    rect,
    viewportW,
    viewportH,
    TILE_CORNER_RADIUS_PX,
  );

  const outerAnim = cloneEl.animate(
    [
      { transform: outerStart, borderRadius: radiusStart },
      { transform: outerEnd, borderRadius: radiusEnd },
    ],
    { duration, easing: EXPAND_EASING, fill: "forwards" },
  );
  animationsRef.current.push(outerAnim);

  if (contentEl) {
    const contentAnim = contentEl.animate(
      [{ transform: contentStart }, { transform: `scale(${CONTENT_END_SCALE})` }],
      { duration, easing: EXPAND_EASING, fill: "forwards" },
    );
    animationsRef.current.push(contentAnim);
  }

  return outerAnim.finished.catch(() => {});
}
