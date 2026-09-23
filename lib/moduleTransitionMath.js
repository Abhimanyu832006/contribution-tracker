/**
 * Pure math for the dashboard's module transition — no DOM, no React.
 *
 * Model (Samsung Tizen-style app launch, not a spinner/orbit):
 *   1. Spatial expansion — the clicked tile does a shared-element FLIP
 *      from its exact grid rect to fullscreen.
 *   2. Layout displacement — every other tile is pushed radially away
 *      from the clicked tile's center until it clears the viewport,
 *      instead of fading or spinning in place.
 *
 * Both motions are straight-line (translate/scale between two known
 * endpoints), so native WAAPI/CSS easing does the interpolation — no
 * manual keyframe sampling is needed (that was only required for the
 * old circular-orbit motion, which isn't expressible as a 2-point lerp).
 */

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
 */
export function buildExpansionTransforms(rect, viewportW, viewportH) {
  const baseSX = rect.width / viewportW;
  const baseSY = rect.height / viewportH;
  return {
    outerStart: `translate(${rect.left}px, ${rect.top}px) scale(${baseSX}, ${baseSY})`,
    outerEnd: "translate(0px, 0px) scale(1, 1)",
    contentStart: `scale(${1 / baseSX}, ${1 / baseSY})`,
  };
}
