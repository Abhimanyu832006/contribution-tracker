/**
 * Pure math for the dashboard's module transition — no DOM, no React.
 *
 * Model: "Contextual Grid Parting with In-Place Fade Expansion" — the
 * selected tile is the anchor point and grows gracefully in place to
 * take over the screen (a soft, longer, near-linear scale — never a
 * punchy "blast"), while every other tile parts away radially from that
 * anchor: pushed outward along its own position vector, shrinking
 * slightly and fading completely to 0 opacity, with a quick-snap/smooth-
 * decelerate easing distinct from the anchor's softer curve.
 *
 * Both motions are straight-line (translate/scale between two known
 * endpoints), so native WAAPI/CSS easing does the interpolation — no
 * manual keyframe sampling is needed.
 */

/** Parting tiles: quick outward snap, smooth deceleration — distinct
 * from the anchor's softer curve so the two motions read as "siblings
 * clear out fast while the focus item settles in gracefully." */
export const PART_EASING = "cubic-bezier(0.25, 1, 0.5, 1)";

/** Anchor tile: a soft, near-linear grow — deliberately NOT a snappy
 * ease-out "blast." Content gains focus gracefully rather than jarringly. */
export const EXPAND_EASING = "linear";

/** How much a parting tile shrinks by the time it's fully faded out. */
export const PART_SHRINK_SCALE = 0.82;

export function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Unit direction vector from the clicked tile's center (pivot) to
 * another tile's center — this is the direction that tile gets pushed
 * away in. Falls back to a deterministic angle if a tile's center
 * exactly coincides with the pivot (shouldn't happen in practice, since
 * callers skip the selected tile itself).
 */
export function computePushDirection(tileRect, pivot, fallbackAngle = 0) {
  const cx = tileRect.left + tileRect.width / 2;
  const cy = tileRect.top + tileRect.height / 2;
  const dx = cx - pivot.x;
  const dy = cy - pivot.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) {
    return { x: Math.cos(fallbackAngle), y: Math.sin(fallbackAngle) };
  }
  return { x: dx / dist, y: dy / dist };
}

/**
 * Travel distance guaranteed to carry a tile fully off-screen from any
 * starting point inside the viewport, moved in a straight line — the
 * viewport's own diagonal is always sufficient.
 */
export function computePushTravel(viewportW, viewportH) {
  return Math.hypot(viewportW, viewportH);
}

/**
 * Start/end transform strings for the clicked tile's shared-element
 * expansion. The clone's outer surface is a fixed 100vw x 100vh element
 * (transform-origin 0 0); scaling it down to (rect.width/vw,
 * rect.height/vh) and translating to (rect.left, rect.top) makes it
 * visually match the real tile exactly. `contentStart` is the inverse
 * scale that keeps the inner content at its natural resting size
 * despite the outer being shrunk — the content's own end scale (a
 * modest, independently-tuned growth, not a raw pass-through of the
 * outer's ~6-8x growth) is supplied by the caller.
 *
 * `radiusStart`/`radiusEnd` compensate for the fact that a CSS
 * transform's scale also visually scales border-radius: a flat 20px
 * radius on a box shrunk to (baseSX, baseSY) would render as a
 * squashed ellipse (20*baseSX by 20*baseSY), not a clean 20px corner
 * matching the real tile. Declaring an elliptical radius of
 * (cornerRadiusPx/baseSX, cornerRadiusPx/baseSY) pre-compensates so the
 * SCALED result renders as an exact `cornerRadiusPx` circular corner at
 * t=0 — pixel-identical to the real tile — then interpolates to a flat
 * 0px by the time the surface reaches fullscreen (scale 1,1, where no
 * compensation is needed).
 */
export function buildExpansionTransforms(rect, viewportW, viewportH, cornerRadiusPx = 0) {
  const baseSX = rect.width / viewportW;
  const baseSY = rect.height / viewportH;
  return {
    outerStart: `translate(${rect.left}px, ${rect.top}px) scale(${baseSX}, ${baseSY})`,
    outerEnd: "translate(0px, 0px) scale(1, 1)",
    contentStart: `scale(${1 / baseSX}, ${1 / baseSY})`,
    radiusStart: `${cornerRadiusPx / baseSX}px / ${cornerRadiusPx / baseSY}px`,
    radiusEnd: "0px",
  };
}
