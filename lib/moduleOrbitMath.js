/**
 * Pure math helpers for the dashboard's module-orbit transition. Kept
 * separate from the controller so the easing/orbit formulas can be
 * tuned or unit-tested without touching React/DOM code.
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

/**
 * Where a non-selected tile should be positioned this frame, orbiting
 * around a (possibly moving) pivot point.
 *
 * @param {object} tileState - { angle0, radius0, cx0, cy0, stagger }
 *   angle0/radius0: this tile's initial polar position relative to the
 *   pivot, captured once at click time. cx0/cy0: this tile's own
 *   original screen center (its transform is relative to itself, not
 *   the pivot, since it never leaves normal document flow).
 * @param {number} elapsedMs - time since the whole transition started
 * @param {{x:number,y:number}} pivot - the selected tile's *current*
 *   (growing) center, so the others visibly orbit the hero as it grows
 * @param {object} opts - { durationMs, orbitRadians, radiusGrowth, selfSpinDeg, fadeStart }
 * @returns {{dx:number, dy:number, scale:number, spinDeg:number, opacity:number}}
 */
export function computeOrbitFrame(tileState, elapsedMs, pivot, opts) {
  const { angle0, radius0, cx0, cy0, stagger } = tileState;
  const { durationMs, orbitRadians, radiusGrowth, selfSpinDeg, fadeStart } = opts;

  const localElapsed = Math.max(0, elapsedMs - stagger);
  const t = clamp01(localElapsed / durationMs);
  const e = easeInOutCubic(t);

  const angle = angle0 + orbitRadians * e;
  const radius = radius0 * (1 + radiusGrowth * e);
  const targetX = pivot.x + radius * Math.cos(angle);
  const targetY = pivot.y + radius * Math.sin(angle);

  const dx = targetX - cx0;
  const dy = targetY - cy0;
  const scale = lerp(1, 0.22, e);
  const spinDeg = selfSpinDeg * e;
  const opacity = t < fadeStart ? 1 : Math.max(0, 1 - (t - fadeStart) / (1 - fadeStart));

  return { dx, dy, scale, spinDeg, opacity };
}

/**
 * The growing hero clone's transform this frame, expressed purely as
 * `transform` (translate+scale from a fixed, full-viewport box) so no
 * width/height/top/left ever animates. Also returns the box's current
 * visual center, used as the other tiles' orbit pivot.
 */
export function computeHeroFrame(rect, elapsedMs, durationMs, viewportW, viewportH) {
  const t = clamp01(elapsedMs / durationMs);
  const e = easeInOutCubic(t);

  const tx = lerp(rect.left, 0, e);
  const ty = lerp(rect.top, 0, e);
  const sx = lerp(rect.width / viewportW, 1, e);
  const sy = lerp(rect.height / viewportH, 1, e);

  return {
    transform: `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`,
    center: { x: tx + (sx * viewportW) / 2, y: ty + (sy * viewportH) / 2 },
    progress: e,
  };
}
