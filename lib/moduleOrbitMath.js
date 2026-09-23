/**
 * Pure math for the dashboard's two-phase module transition — no DOM, no
 * React. Phase 1: a circular loading formation all 6 tiles rotate around
 * together. Phase 2: a FLIP-style expansion of the selected tile with an
 * independently-tuned content growth curve. All geometry is read once by
 * the caller and handed in here; nothing in this file touches the DOM.
 */

export function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeInOutSine(t) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/** Bounding-box center of every tile's rect. */
export function computeFormationCenter(rects) {
  const lefts = rects.map((r) => r.left);
  const rights = rects.map((r) => r.left + r.width);
  const tops = rects.map((r) => r.top);
  const bottoms = rects.map((r) => r.top + r.height);
  return {
    x: (Math.min(...lefts) + Math.max(...rights)) / 2,
    y: (Math.min(...tops) + Math.max(...bottoms)) / 2,
  };
}

/**
 * Solves for a formation radius that GUARANTEES no card overlap for N
 * evenly-spaced points around a circle, preferring to shrink the tiles'
 * uniform scale before ever shrinking the radius below what's needed —
 * overlap is never acceptable; staying under the viewport's comfortable
 * radius cap is negotiable.
 *
 * For N evenly-spaced points, neighbor-to-neighbor chord length is
 * `2R * sin(pi/N)`. For N=6 that's exactly `R` (sin(30°) = 0.5). The
 * safe minimum radius at tile scale `s` is `2 * s * rMax * margin`,
 * where rMax is the largest tile's half-diagonal at scale 1.
 */
export function computeFormationRadius(rects, viewportW, viewportH, tileCount, margin = 1.1) {
  const rMax = Math.max(...rects.map((r) => Math.hypot(r.width, r.height) / 2));
  const sinTerm = Math.sin(Math.PI / tileCount);
  const rMaxCap = Math.min(viewportW, viewportH) * 0.42;

  // No-overlap requirement for N evenly-spaced points: neighbor chord
  // `2R*sin(pi/N)` must be >= the sum of neighboring tiles' footprints
  // `2 * s * rMax * margin`, i.e. `R >= s * rMax * margin / sin(pi/N)`.
  // Solve for the largest scale `s` that satisfies this AT the viewport's
  // comfortable radius cap; if that would require s below a legible
  // floor, keep the floor scale and let the radius exceed the cap instead
  // — overlap is never acceptable, exceeding the soft visual cap is.
  const scaleAtCap = (rMaxCap * sinTerm) / (rMax * margin);
  const scale = Math.min(1, Math.max(0.5, scaleAtCap));
  const radius = (scale * rMax * margin) / sinTerm;

  return { radius, scale };
}

/**
 * Assigns each tile an evenly-spaced target angle around the circle,
 * ordered by each tile's CURRENT angle from the pivot — so the grid's
 * visual left-to-right/top-to-bottom order maps onto the circle instead
 * of criss-crossing tiles past each other.
 */
export function assignFormationAngles(rects, pivot) {
  const currentAngles = rects.map((r) => {
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    return Math.atan2(cy - pivot.y, cx - pivot.x);
  });
  const order = currentAngles
    .map((angle, index) => ({ angle, index }))
    .sort((a, b) => a.angle - b.angle)
    .map((entry) => entry.index);

  const n = rects.length;
  const targetAngles = new Array(n);
  order.forEach((tileIndex, slot) => {
    targetAngles[tileIndex] = -Math.PI / 2 + slot * ((2 * Math.PI) / n);
  });
  return { currentAngles, targetAngles };
}

/**
 * Builds a sampled keyframe array for one tile's phase-1 motion. Offsets
 * land exactly on the stage boundaries (0.158, 0.789) so the deceleration
 * stage isn't smoothed away by uneven sampling.
 *
 * @param {object} p
 * @param {number} p.angle0 tile's current angle from the pivot
 * @param {number} p.radius0 tile's current distance from the pivot
 * @param {number} p.cx0 tile's own current center x (transform is relative to its own box)
 * @param {number} p.cy0 tile's own current center y
 * @param {number} p.targetAngle tile's assigned slot angle
 * @param {number} p.radius solved formation radius
 * @param {{x:number,y:number}} p.pivot shared formation center
 * @param {number} p.orbitSweep total radians the group sweeps during the orbit stage
 * @param {number} p.snapEnd fraction of total duration where "snap onto circle" ends (e.g. 150/950)
 * @param {number} p.decelStart fraction where deceleration begins (e.g. 750/950)
 * @param {number} p.selectedScaleEnd final scale for the selected tile (1 for others)
 * @param {boolean} p.isSelected
 */
export function buildFormationKeyframes(p) {
  const {
    angle0,
    radius0,
    cx0,
    cy0,
    targetAngle,
    radius,
    pivot,
    orbitSweep,
    snapEnd,
    decelStart,
    selectedScaleEnd = 1,
    isSelected,
  } = p;

  const offsets = [
    ...linspace(0, snapEnd, 5),
    ...linspace(snapEnd, decelStart, 16).slice(1),
    ...linspace(decelStart, 1, 8).slice(1),
  ];

  return offsets.map((t) => {
    let angle;
    let r;
    let opacity = 1;

    if (t <= snapEnd) {
      const e = easeOutCubic(t / snapEnd);
      angle = lerpAngle(angle0, targetAngle, e);
      r = lerp(radius0, radius, e);
    } else if (t <= decelStart) {
      const e = easeInOutSine((t - snapEnd) / (decelStart - snapEnd));
      angle = targetAngle + orbitSweep * 0.8 * e;
      r = radius;
    } else {
      const localT = (t - decelStart) / (1 - decelStart);
      const e = easeOutCubic(localT);
      angle = targetAngle + orbitSweep * 0.8 + orbitSweep * 0.2 * e;
      r = radius;
      if (!isSelected) opacity = lerp(1, 0, localT);
    }

    const targetX = pivot.x + r * Math.cos(angle);
    const targetY = pivot.y + r * Math.sin(angle);
    const scale = isSelected ? lerp(1, selectedScaleEnd, clamp01(t / snapEnd)) : 1;

    return {
      offset: t,
      transform: `translate(${targetX - cx0}px, ${targetY - cy0}px) scale(${scale})`,
      opacity,
    };
  });
}

/**
 * Builds the phase-2 expansion keyframes: the outer surface interpolates
 * translate+scale from the captured rect to fullscreen (transform-only —
 * no width/height/top/left), while the content wrapper gets its OWN,
 * independently-tuned growth curve (not a 1/scale reciprocal, which would
 * hold it at a tiny constant size — instead it grows noticeably, just far
 * less than the surface, so it neither looks abandoned-tiny nor blurs out
 * from oversized scaling).
 */
export function buildExpansionKeyframes({ rect, viewportW, viewportH, contentEndScale = 2.4, samples = 20 }) {
  const offsets = linspace(0, 1, samples);
  const surface = [];
  const content = [];

  offsets.forEach((t) => {
    const e = easeInOutCubic(t);
    const tx = lerp(rect.left, 0, e);
    const ty = lerp(rect.top, 0, e);
    const sx = lerp(rect.width / viewportW, 1, e);
    const sy = lerp(rect.height / viewportH, 1, e);
    surface.push({ offset: t, transform: `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})` });

    // Content stays fully visible for the whole expansion — the later
    // reveal-of-destination fade is a separate, whole-overlay animation
    // the provider runs afterward once real readiness is confirmed, not
    // baked in here.
    const contentScale = lerp(1, contentEndScale, easeOutCubic(t));
    content.push({ offset: t, transform: `scale(${contentScale})`, opacity: 1 });
  });

  return { surface, content };
}

function linspace(start, end, count) {
  if (count <= 1) return [start];
  const step = (end - start) / (count - 1);
  return Array.from({ length: count }, (_, i) => start + step * i);
}

/** Shortest-path angle interpolation (avoids spinning the long way around). */
function lerpAngle(a, b, t) {
  let diff = b - a;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return a + diff * t;
}
