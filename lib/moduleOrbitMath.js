/**
 * Pure math for the dashboard's module transition — no DOM, no React.
 *
 * The transition is ONE continuous morph — a single flow, not phases:
 *
 *   compress toward pivot (spring)
 *   → orbit at ramped-up angular velocity (buffering formation)
 *   → non-selected fade / selected emerges outward
 *   → selected genie-maximizes to fullscreen
 *
 * All tiles share the same pivot/radius/target-angle math. What differs
 * per tile is only:
 *   - starting angle & radius (from its own current rect)
 *   - whether it fades out or genie-expands at the end
 *
 * All geometry is read ONCE by the caller before any animation begins
 * and handed in here — nothing in this file touches the DOM.
 */

// ── Primitives ─────────────────────────────────────────────────

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

export function easeInCubic(t) {
  return t * t * t;
}

export function easeOutQuint(t) {
  return 1 - Math.pow(1 - t, 5);
}

/**
 * Critically-damped spring response — no overshoot, arrives smoothly at 1.
 * The soft "pulled by a physical force" feel of the compress phase comes
 * from this being baked into the sample distribution, not from CSS easing.
 */
export function springCritical(t) {
  const p = clamp01(t);
  return 1 - Math.exp(-6 * p) * (1 + 6 * p);
}

/**
 * Mildly underdamped spring — soft, tiny overshoot for the "arriving into
 * the formation" moment so it doesn't feel purely mechanical.
 */
export function springSoft(t) {
  const p = clamp01(t);
  const decay = Math.exp(-5 * p);
  return 1 - decay * Math.cos(3.6 * p);
}

// ── Formation geometry ────────────────────────────────────────

/** Bounding-box center of every tile's rect — the shared orbit pivot. */
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
 * evenly-spaced points. For N=6 the neighbor chord is `2R·sin(30°) = R`,
 * so `R ≥ 2·s·rRef·margin`. Priority: shrink `s` first (down to a legible
 * floor), only if `s` hits the floor and still doesn't fit does `R`
 * exceed the soft viewport cap — overlap is never acceptable.
 *
 * `rRef` uses the 70th-percentile tile diagonal, not the max, so one
 * outlier-big tile (e.g. the col-span-2 row-span-2 Contributions tile)
 * doesn't blow the whole formation radius out beyond the viewport. The
 * big tile is separately scaled tighter to fit — see the compressScale
 * override in buildNonSelectedKeyframes call sites.
 */
export function computeFormationRadius(rects, viewportW, viewportH, tileCount, margin = 1.15) {
  const diagonals = rects.map((r) => Math.hypot(r.width, r.height)).sort((a, b) => a - b);
  const rRef = diagonals[Math.max(0, Math.floor(diagonals.length * 0.7))] / 2;
  const sinTerm = Math.sin(Math.PI / tileCount);
  const rMaxCap = Math.min(viewportW, viewportH) * 0.30;

  const scaleAtCap = (rMaxCap * sinTerm) / (rRef * margin);
  const scale = Math.min(1, Math.max(0.5, scaleAtCap));
  const radius = (scale * rRef * margin) / sinTerm;

  return { radius, scale };
}

/**
 * Assigns each tile an evenly-spaced target slot, ordered by each tile's
 * CURRENT angle from the pivot — the grid's visual layout maps onto the
 * circle instead of criss-crossing tiles past each other on the way in.
 * Starts at 12 o'clock so the formation reads as top-anchored.
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

// ── Timing constants (fractions of NON_SELECTED_DURATION_MS) ────
//
// The two morphs run concurrently and share the compress+orbit window.
// After the orbit, the non-selected tiles fade out while the selected
// clone smoothly extracts outward, then genie-maximizes to fullscreen.
//
// Non-selected timing (fractions of NON_SELECTED_DURATION_MS ~= 1050):
//   COMPRESS_END = 0.33   (~350ms)
//   ORBIT_END    = 0.81   (~850ms)
//   FADE_END     = 1.00   (~1050ms)
//
// Selected clone timing (fractions of SELECTED_PREMAX_DURATION_MS ~= 1050):
//   compress+orbit share the SAME fractions as non-selected
//   EMERGE_END   = 1.00   (~1050ms — mirror the non-selected's total)
// Then a separate maximize animation (~550ms) begins at emerge end.

export const NON_SEL_COMPRESS_END = 0.33;
export const NON_SEL_ORBIT_END = 0.81;

export const SEL_PRE_COMPRESS_END = 0.33;
export const SEL_PRE_ORBIT_END = 0.81;
// SEL_PRE_EMERGE_END is the entire pre-max animation (1.0)

// ── Sample-distribution helper ────────────────────────────────

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

// ── Non-selected tile keyframes ────────────────────────────────

/**
 * Builds ONE continuous WAAPI keyframe array for a non-selected tile:
 * compress toward its slot (spring), then orbit at the group's shared
 * angular velocity, then decelerate + fade to opacity 0. Sampled densely
 * across each stage; `easing: "linear"` between samples since the curves
 * are baked into the sample distribution.
 *
 * Angular velocity is continuous through the compress→orbit transition
 * (compress ramps velocity from 0 up to omega_full; orbit runs at
 * omega_full; fade decays it) — this is what makes the whole thing read
 * as one motion instead of "snap into position then start rotating."
 */
export function buildNonSelectedKeyframes({
  angle0,
  radius0,
  cx0,
  cy0,
  targetAngle,
  radius,
  pivot,
  orbitSweep,
  compressScale = 0.78,
}) {
  const offsets = [
    ...linspace(0, NON_SEL_COMPRESS_END, 14),
    ...linspace(NON_SEL_COMPRESS_END, NON_SEL_ORBIT_END, 20).slice(1),
    ...linspace(NON_SEL_ORBIT_END, 1, 10).slice(1),
  ];

  return offsets.map((t) => {
    let angle;
    let r;
    let scale;
    let opacity = 1;

    if (t <= NON_SEL_COMPRESS_END) {
      const p = t / NON_SEL_COMPRESS_END;
      // Radius uses the mildly-overshooting spring for a soft "arriving"
      // feel; angle uses the critically-damped spring to keep the swept
      // path clean (no oscillation across the pivot).
      const eR = springSoft(p);
      const eA = springCritical(p);
      angle = lerpAngle(angle0, targetAngle, eA);
      r = lerp(radius0, radius, eR);
      // Angular velocity ramps in during compression — by the time each
      // tile reaches its slot, it's already moving at the group's shared
      // angular velocity, so the orbit phase continues seamlessly rather
      // than starting from rest.
      const ramp = 0.5 * p * p; // v(t) = p → integrate to 0.5p²
      angle += orbitSweep * 0.12 * ramp;
      // Scale also springs (not cubic) so the tiles shrink WITH the
      // inward motion rather than lagging behind it — key to the "soft
      // physical pull" feel; a cubic ramp reads as "cards move first,
      // shrink later" which looks disjointed.
      scale = lerp(1, compressScale, springCritical(p));
    } else if (t <= NON_SEL_ORBIT_END) {
      const p = (t - NON_SEL_COMPRESS_END) / (NON_SEL_ORBIT_END - NON_SEL_COMPRESS_END);
      // Full orbit sweep at constant angular velocity — soft ease in/out
      // on the outer edges keeps the transition to/from adjacent stages
      // fluid, but the middle is close to linear so it reads as steady
      // rotation, not "accelerate-decelerate-accelerate."
      const e = easeInOutSine(p);
      angle = targetAngle + orbitSweep * 0.12 + orbitSweep * 0.76 * e;
      r = radius;
      scale = compressScale;
    } else {
      const p = (t - NON_SEL_ORBIT_END) / (1 - NON_SEL_ORBIT_END);
      // Fade + gentle final rotation as the tile drifts out.
      const decel = easeOutCubic(p);
      angle = targetAngle + orbitSweep * 0.88 + orbitSweep * 0.12 * decel;
      r = radius;
      scale = lerp(compressScale, compressScale * 0.88, p);
      opacity = lerp(1, 0, easeInOutCubic(p));
    }

    const targetX = pivot.x + r * Math.cos(angle);
    const targetY = pivot.y + r * Math.sin(angle);
    return {
      offset: t,
      transform: `translate(${targetX - cx0}px, ${targetY - cy0}px) scale(${scale})`,
      opacity,
    };
  });
}

// ── Selected clone: pre-maximize (compress + orbit + emerge) ────

/**
 * Builds the selected clone's PRE-MAXIMIZE keyframes for the fullscreen-
 * anchored portal element. The clone's outer div is 100vw × 100vh with
 * transform-origin 0 0; its visual box at any time is:
 *
 *   visual size = (viewportW * outerScaleX, viewportH * outerScaleY)
 *   visual top-left = (outerTx, outerTy)
 *   visual center = (outerTx + viewportW*outerScaleX/2, outerTy + viewportH*outerScaleY/2)
 *
 * We drive it so its visual box exactly matches the tile position/size at
 * every point in the morph (compress + orbit + emerge). The counter-scale
 * for the inner content div (see buildSelectedContentKeyframes) keeps
 * content visually natural throughout, so the icon/stat/label don't
 * distort along with the container.
 *
 * During EMERGE the clone breaks radially outward (radius grows) and its
 * angular velocity decelerates — you literally see it separate from the
 * circular buffer, spatial continuity preserved for the handoff into the
 * maximize animation.
 */
export function buildSelectedPreMaxKeyframes({
  rect,
  viewportW,
  viewportH,
  angle0,
  radius0,
  targetAngle,
  radius,
  pivot,
  orbitSweep,
  compressScale = 0.78,
  emergeScale = 0.94,
}) {
  const offsets = [
    ...linspace(0, SEL_PRE_COMPRESS_END, 14),
    ...linspace(SEL_PRE_COMPRESS_END, SEL_PRE_ORBIT_END, 20).slice(1),
    ...linspace(SEL_PRE_ORBIT_END, 1, 12).slice(1),
  ];

  const baseSX = rect.width / viewportW;
  const baseSY = rect.height / viewportH;

  // At the end of the orbit stage, the clone is at:
  //   angle = targetAngle + orbitSweep * 0.88
  //   position = pivot + radius * (cos, sin)(angle)
  // The emerge stage smoothly interpolates its center FROM that point TO
  // the viewport center — this preserves spatial continuity (no jump)
  // while landing at a predictable position where the maximize can take
  // over. Reads as "the card is being pulled forward toward you" rather
  // than continuing on the buffer's circle.
  const orbitEndAngle = targetAngle + orbitSweep * 0.88;
  const orbitEndCX = pivot.x + radius * Math.cos(orbitEndAngle);
  const orbitEndCY = pivot.y + radius * Math.sin(orbitEndAngle);
  const emergeEndCX = viewportW / 2;
  const emergeEndCY = viewportH / 2;

  return offsets.map((t) => {
    let cx;
    let cy;
    let s;

    if (t <= SEL_PRE_COMPRESS_END) {
      const p = t / SEL_PRE_COMPRESS_END;
      const eR = springSoft(p);
      const eA = springCritical(p);
      let angle = lerpAngle(angle0, targetAngle, eA);
      const r = lerp(radius0, radius, eR);
      const ramp = 0.5 * p * p;
      angle += orbitSweep * 0.12 * ramp;
      cx = pivot.x + r * Math.cos(angle);
      cy = pivot.y + r * Math.sin(angle);
      // Spring on scale (matches non-selected) so the clone shrinks WITH
      // the inward motion — no visual disjoint between it and the 5
      // real tiles it's supposed to look like part of.
      s = lerp(1, compressScale, springCritical(p));
    } else if (t <= SEL_PRE_ORBIT_END) {
      const p = (t - SEL_PRE_COMPRESS_END) / (SEL_PRE_ORBIT_END - SEL_PRE_COMPRESS_END);
      const e = easeInOutSine(p);
      const angle = targetAngle + orbitSweep * 0.12 + orbitSweep * 0.76 * e;
      cx = pivot.x + radius * Math.cos(angle);
      cy = pivot.y + radius * Math.sin(angle);
      s = compressScale;
    } else {
      const p = (t - SEL_PRE_ORBIT_END) / (1 - SEL_PRE_ORBIT_END);
      const e = easeOutCubic(p);
      // Straight-line motion from orbit-end to viewport-center — no more
      // circular motion at this point; the card is separating from the
      // buffer and moving toward the user.
      cx = lerp(orbitEndCX, emergeEndCX, e);
      cy = lerp(orbitEndCY, emergeEndCY, e);
      s = lerp(compressScale, emergeScale, e);
    }

    const scaleX = baseSX * s;
    const scaleY = baseSY * s;
    const tx = cx - viewportW * scaleX / 2;
    const ty = cy - viewportH * scaleY / 2;

    return {
      offset: t,
      transform: `translate(${tx}px, ${ty}px) scale(${scaleX}, ${scaleY})`,
      opacity: 1,
    };
  });
}

/**
 * Content wrapper for the pre-maximize stage: counter-scales the outer's
 * shrinking (baseSX*s), keeping content visually at natural tile size the
 * whole time (compress + orbit + emerge). Non-uniform scale mirrors the
 * outer's non-uniform scale so content ends up the same visual dimensions
 * as the outer's tile-sized visual box.
 */
export function buildSelectedPreMaxContentKeyframes({
  rect,
  viewportW,
  viewportH,
  compressScale = 0.78,
  emergeScale = 0.92,
}) {
  const offsets = [
    ...linspace(0, SEL_PRE_COMPRESS_END, 8),
    ...linspace(SEL_PRE_COMPRESS_END, SEL_PRE_ORBIT_END, 10).slice(1),
    ...linspace(SEL_PRE_ORBIT_END, 1, 8).slice(1),
  ];

  const baseSX = rect.width / viewportW;
  const baseSY = rect.height / viewportH;

  return offsets.map((t) => {
    let s;
    if (t <= SEL_PRE_COMPRESS_END) {
      const p = t / SEL_PRE_COMPRESS_END;
      // Match the outer's spring easing so content stays visually-natural
      // sized at every frame during compress (any easing mismatch would
      // make text pop-shrink or pop-grow relative to its container).
      s = lerp(1, compressScale, springCritical(p));
    } else if (t <= SEL_PRE_ORBIT_END) {
      s = compressScale;
    } else {
      const p = (t - SEL_PRE_ORBIT_END) / (1 - SEL_PRE_ORBIT_END);
      s = lerp(compressScale, emergeScale, easeOutCubic(p));
    }
    // Counter-scale so content visual size = rect.{width,height} regardless
    // of outer's shrink. Non-uniform to exactly reverse the outer's non-
    // uniform scale — text stretches by baseSX/baseSY which is ~6% for
    // typical tile aspect ratios (imperceptible).
    return {
      offset: t,
      transform: `scale(${1 / (baseSX * s)}, ${1 / (baseSY * s)})`,
      opacity: 1,
    };
  });
}

// ── Selected clone: genie maximize ────────────────────────────

/**
 * Builds the maximize animation for the selected clone — a transform-only
 * FLIP from the "emerge end" outer transform to fullscreen. The starting
 * transform MUST equal the last keyframe of the pre-maximize animation
 * exactly so there's no visible seam between the two WAAPI animations —
 * the caller passes `startOuterState` computed with the same helper the
 * pre-max end uses.
 */
export function buildMaximizeKeyframes({
  rect,
  viewportW,
  viewportH,
  startCenter,     // {x, y} — clone's visual center at end of emerge
  startScale,      // scalar — compressed tile scale factor `s` at end of emerge
  samples = 22,
}) {
  const offsets = linspace(0, 1, samples);
  const baseSX = rect.width / viewportW;
  const baseSY = rect.height / viewportH;

  const startScaleX = baseSX * startScale;
  const startScaleY = baseSY * startScale;
  const startTx = startCenter.x - viewportW * startScaleX / 2;
  const startTy = startCenter.y - viewportH * startScaleY / 2;

  return offsets.map((t) => {
    // easeInOutCubic gives the maximize a slight overshoot-free "swell"
    // at start and cushioned settle at end — reads as a solid mac-style
    // window maximize rather than a linear ramp.
    const e = easeInOutCubic(t);
    const sx = lerp(startScaleX, 1, e);
    const sy = lerp(startScaleY, 1, e);
    const tx = lerp(startTx, 0, e);
    const ty = lerp(startTy, 0, e);
    return {
      offset: t,
      transform: `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`,
      opacity: 1,
    };
  });
}

/**
 * Content keyframes for the maximize stage — smoothly interpolates from
 * the counter-scale that kept content visually natural during emerge, to
 * a modest per-axis growth by fullscreen (~2.4× the resting visual size).
 * Not a 1/scale reciprocal (which produces "tiny text in a huge rectangle"
 * the user rejected) and not a raw pass-through of the outer scale (which
 * blows content up ~7×). Ends noticeably larger than resting, far short
 * of the outer's growth.
 */
export function buildMaximizeContentKeyframes({
  rect,
  viewportW,
  viewportH,
  startScale,           // scalar `s` at emerge end (matches pre-max end)
  contentEndScale = 2.4,
  samples = 18,
}) {
  const offsets = linspace(0, 1, samples);
  const baseSX = rect.width / viewportW;
  const baseSY = rect.height / viewportH;
  const startCSX = 1 / (baseSX * startScale);
  const startCSY = 1 / (baseSY * startScale);

  return offsets.map((t) => {
    const e = easeOutCubic(t);
    const csx = lerp(startCSX, contentEndScale, e);
    const csy = lerp(startCSY, contentEndScale, e);
    return {
      offset: t,
      transform: `scale(${csx}, ${csy})`,
      opacity: 1,
    };
  });
}

/**
 * Helper for the caller — computes exactly the same "end of emerge" outer
 * center/scale that buildSelectedPreMaxKeyframes' last keyframe uses, so
 * the maximize animation can start from a byte-identical state. The
 * emerge target is deterministically the viewport center (regardless of
 * where in the orbit the sweep ended), so the maximize always begins
 * from a predictable, visible location.
 */
export function computeSelectedEmergeEndState({
  viewportW,
  viewportH,
  emergeScale = 0.94,
}) {
  return {
    center: { x: viewportW / 2, y: viewportH / 2 },
    scale: emergeScale,
  };
}
