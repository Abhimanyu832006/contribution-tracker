"use client";

import {
  buildSelectedPreMaxKeyframes,
  buildSelectedPreMaxContentKeyframes,
  buildMaximizeKeyframes,
  buildMaximizeContentKeyframes,
  computeSelectedEmergeEndState,
} from "@/lib/moduleOrbitMath";
import { getModuleGlowShadow } from "@/lib/moduleThemes";

/**
 * Selected clone's pre-maximize morph (compress → orbit → emerge) shares
 * the non-selected morph's total duration, so the six cards read as ONE
 * animated formation until the selected one visibly extracts outward at
 * the very end.
 */
export const SELECTED_PREMAX_DURATION_MS = 1050;

/**
 * Genie maximize expansion — clone smoothly grows from its emerge-end
 * orbital position into fullscreen. Reasonably fast so the destination
 * page has real time to load underneath it (navigation fires the instant
 * this begins) but long enough to read as a deliberate window maximize
 * rather than a snap.
 */
export const MAXIMIZE_DURATION_MS = 560;

const ORBIT_SWEEP_RAD = 1.15 * 2 * Math.PI;
const COMPRESS_SCALE = 0.78;
const EMERGE_SCALE = 0.94;
const CONTENT_END_SCALE = 2.4;

/**
 * Presentational portal clone — the same visual atoms as ModuleTile
 * (icon, stat, label) but sized/positioned via transforms only, never
 * layout. The outer div is a full-viewport surface from the very first
 * frame; its `transform` is what visually shrinks it down to exactly
 * match the selected tile's captured rect at t=0, moves it around during
 * the morph, and grows it back out to fill the viewport at genie-max end.
 *
 * The inner content div has a fixed pixel size (rect.width × rect.height)
 * and is counter-scaled per-frame so it visually stays at natural tile
 * size throughout compress+orbit+emerge, then interpolates to a modest
 * ~2.4× visual growth during the maximize (see buildMaximizeContent-
 * Keyframes for why not a raw 1/scale reciprocal and not a raw pass-
 * through of the outer's ~7× growth).
 */
export function ModuleTransitionClone({
  tile,
  rect,
  viewportW,
  viewportH,
  cloneRef,
  contentRef,
}) {
  const textClass = tile.textLight
    ? "text-[var(--color-ink-fg)]"
    : "text-black";
  const subTextClass = tile.textLight
    ? "text-[var(--color-ink-fg)]/70"
    : "text-black/60";

  // Initial transforms — the outer visually matches the tile rect and the
  // content is counter-scaled so it visually matches the tile's own
  // content dimensions. Set inline (not via WAAPI) so the very first
  // React paint of the clone already looks right — no flash of a
  // fullscreen colored surface before the animation's first keyframe
  // applies.
  const baseSX = rect.width / viewportW;
  const baseSY = rect.height / viewportH;
  const initialOuterTransform =
    `translate(${rect.left}px, ${rect.top}px) scale(${baseSX}, ${baseSY})`;
  const initialContentTransform =
    `scale(${1 / baseSX}, ${1 / baseSY})`;

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
        transform: initialOuterTransform,
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
          transform: initialContentTransform,
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          willChange: "transform",
        }}
      >
        <div className="flex items-center justify-between">
          <svg
            className={`w-6 h-6 sm:w-7 sm:h-7 ${textClass}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
          >
            {tile.icon}
          </svg>
        </div>
        <div>
          {tile.stat !== null && (
            <p className={`stat-num text-3xl sm:text-4xl ${textClass}`}>
              {tile.stat}
            </p>
          )}
          <p
            className={`text-sm font-black uppercase tracking-tight mt-0.5 ${textClass}`}
          >
            {tile.label}
          </p>
          <p className={`text-xs mt-0.5 truncate ${subTextClass}`}>
            {tile.sub || tile.statLabel}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Runs the selected clone's PRE-MAXIMIZE morph (compress → orbit →
 * emerge) as one continuous WAAPI animation on the outer surface, plus a
 * parallel WAAPI animation on the content wrapper that counter-scales
 * the outer's shrink to keep content visually natural throughout.
 *
 * Also runs an independent short glow highlight on the outer (color-
 * matched to the module) that ramps in during the compress stage — the
 * card is visibly "the chosen one" before it emerges from the buffer.
 *
 * Returns { finished, emergeEndState } — the caller awaits `finished` to
 * kick off maximize, and passes `emergeEndState` into
 * runMaximizeExpansion so the two animations start byte-identical.
 */
export function runSelectedPreMax({
  cloneEl,
  contentEl,
  rect,
  viewportW,
  viewportH,
  angle0,
  radius0,
  targetAngle,
  radius,
  pivot,
  compressScale = COMPRESS_SCALE,
  animationsRef,
  moduleKey,
  timeScale = 1,
}) {
  const duration = SELECTED_PREMAX_DURATION_MS * timeScale;

  const outerKF = buildSelectedPreMaxKeyframes({
    rect,
    viewportW,
    viewportH,
    angle0,
    radius0,
    targetAngle,
    radius,
    pivot,
    orbitSweep: ORBIT_SWEEP_RAD,
    compressScale,
    emergeScale: EMERGE_SCALE,
  });

  const contentKF = buildSelectedPreMaxContentKeyframes({
    rect,
    viewportW,
    viewportH,
    compressScale,
    emergeScale: EMERGE_SCALE,
  });

  const outerAnim = cloneEl.animate(outerKF, {
    duration,
    easing: "linear",
    fill: "forwards",
  });
  animationsRef.current.push(outerAnim);

  if (contentEl) {
    const contentAnim = contentEl.animate(contentKF, {
      duration,
      easing: "linear",
      fill: "forwards",
    });
    animationsRef.current.push(contentAnim);
  }

  // Glow highlight — short ramp during the compress stage that then holds
  // through orbit + emerge. Kept short so it doesn't fight the compress
  // motion.
  const glowAnim = cloneEl.animate(
    [
      { boxShadow: "0 0 0 0 rgba(0,0,0,0)", offset: 0 },
      { boxShadow: getModuleGlowShadow(moduleKey), offset: 0.3 },
      { boxShadow: getModuleGlowShadow(moduleKey), offset: 1 },
    ],
    { duration, easing: "ease-out", fill: "forwards" },
  );
  animationsRef.current.push(glowAnim);

  const emergeEndState = computeSelectedEmergeEndState({
    viewportW,
    viewportH,
    emergeScale: EMERGE_SCALE,
  });

  return {
    finished: outerAnim.finished.catch(() => {}),
    emergeEndState,
  };
}

/**
 * Runs the genie maximize — clone's outer surface grows from the emerge-
 * end orbital position to fullscreen, content interpolates from its
 * natural counter-scaled size at emerge end to a modest ~2.4× visual
 * growth at fullscreen. Also fades the glow shadow out as the clone
 * becomes the full page (no shadow on a fullscreen surface — there's
 * nothing behind it to shadow onto).
 */
export function runMaximizeExpansion({
  cloneEl,
  contentEl,
  rect,
  viewportW,
  viewportH,
  emergeEndState,
  animationsRef,
  timeScale = 1,
}) {
  const duration = MAXIMIZE_DURATION_MS * timeScale;

  const outerKF = buildMaximizeKeyframes({
    rect,
    viewportW,
    viewportH,
    startCenter: emergeEndState.center,
    startScale: emergeEndState.scale,
  });

  const contentKF = buildMaximizeContentKeyframes({
    rect,
    viewportW,
    viewportH,
    startScale: emergeEndState.scale,
    contentEndScale: CONTENT_END_SCALE,
  });

  const outerAnim = cloneEl.animate(outerKF, {
    duration,
    easing: "linear",
    fill: "forwards",
  });
  animationsRef.current.push(outerAnim);

  if (contentEl) {
    const contentAnim = contentEl.animate(contentKF, {
      duration,
      easing: "linear",
      fill: "forwards",
    });
    animationsRef.current.push(contentAnim);
  }

  const glowFade = cloneEl.animate(
    [
      { boxShadow: cloneEl.style.boxShadow || "none", offset: 0 },
      { boxShadow: "0 0 0 0 rgba(0,0,0,0)", offset: 1 },
    ],
    { duration, easing: "ease-out", fill: "forwards" },
  );
  animationsRef.current.push(glowFade);

  return outerAnim.finished.catch(() => {});
}
