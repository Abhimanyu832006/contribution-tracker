import { assignFormationAngles, buildFormationKeyframes } from "@/lib/moduleOrbitMath";
import { getModuleGlowShadow } from "@/lib/moduleThemes";

export const PHASE1_DURATION_MS = 950;
const SNAP_END = 150 / 950;
const DECEL_START = 750 / 950;
const ORBIT_SWEEP_RAD = (5 / 6) * 2 * Math.PI; // ~300 degrees total group sweep
const SELECTED_SCALE_END = 1.07;

/**
 * Runs Phase 1: all tiles move onto a shared circular formation and the
 * whole group orbits together (shared angular sweep, no per-tile self
 * rotation), opacity pinned at 1 until the deceleration stage where the
 * non-selected tiles fade fully to 0. Every tile is driven by a single
 * pre-sampled WAAPI animation (`easing: "linear"` between samples, since
 * the curve is already baked into the sample distribution) — no rAF
 * polling, no per-frame React state.
 *
 * @returns {Promise<void>} resolves once the selected tile's own
 *   formation animation finishes (all tiles share one duration, so this
 *   is an accurate proxy for "the whole orbit is done").
 */
export function runModuleOrbit({ tileEntries, selectedIndex, pivot, radius, moduleKey, animationsRef, timeScale = 1 }) {
  const rects = tileEntries.map((entry) => entry.rect);
  const { targetAngles } = assignFormationAngles(rects, pivot);
  const duration = PHASE1_DURATION_MS * timeScale;

  const animations = tileEntries.map((entry, i) => {
    const { el, rect } = entry;
    const cx0 = rect.left + rect.width / 2;
    const cy0 = rect.top + rect.height / 2;
    const angle0 = Math.atan2(cy0 - pivot.y, cx0 - pivot.x);
    const radius0 = Math.hypot(cx0 - pivot.x, cy0 - pivot.y) || 1;
    const isSelected = i === selectedIndex;

    // Kill the `.stagger-children` mount animation before driving this
    // tile ourselves — its fill-mode:both end value otherwise silently
    // overrides any WAAPI/inline style change to the same properties.
    el.style.animation = "none";
    el.style.willChange = "transform, opacity";

    const keyframes = buildFormationKeyframes({
      angle0,
      radius0,
      cx0,
      cy0,
      targetAngle: targetAngles[i],
      radius,
      pivot,
      orbitSweep: ORBIT_SWEEP_RAD,
      snapEnd: SNAP_END,
      decelStart: DECEL_START,
      selectedScaleEnd: isSelected ? SELECTED_SCALE_END : 1,
      isSelected,
    });

    const anim = el.animate(keyframes, { duration, easing: "linear", fill: "forwards" });
    animationsRef.current.push(anim);

    if (isSelected) {
      const glowAnim = el.animate(
        [
          { boxShadow: "var(--shadow-brutal)", offset: 0 },
          { boxShadow: getModuleGlowShadow(moduleKey), offset: 1 },
        ],
        { duration: 150 * timeScale, easing: "ease-out", fill: "forwards" }
      );
      animationsRef.current.push(glowAnim);
    }

    return anim;
  });

  return animations[selectedIndex].finished.catch(() => {});
}
