import {
  computePushDirection,
  computePushTravel,
  PART_EASING,
  PART_SHRINK_SCALE,
} from "@/lib/moduleTransitionMath";

/**
 * How long the non-selected tiles take to clear the viewport — quick
 * and short relative to the anchor tile's own, longer, softer expansion
 * (see EXPAND_DURATION_MS in ModuleTransition.js). The parting tiles
 * "snap outward quickly and decelerate smoothly" while the anchor takes
 * its time settling into fullscreen — two distinct paces on purpose.
 */
export const PUSH_DURATION_MS = 380;

/**
 * Pushes every non-selected tile radially away from the clicked tile's
 * center until it clears the viewport, shrinking slightly and fading to
 * 0 opacity along the way — the "parting" half of the Contextual Grid
 * Parting pattern: siblings don't spin or hold their size, they visibly
 * recede from the point of focus.
 *
 * Each tile is one WAAPI animation: a straight-line translate+scale
 * (native easing handles the curve — no manual sampling needed for a
 * 2-point path) with opacity fading in step.
 *
 * @returns {Promise<void>} resolves once every sibling's parting
 *   animation has finished.
 */
export function runSiblingPush({
  tileEntries,
  selectedIndex,
  pivot,
  viewportW,
  viewportH,
  animationsRef,
  timeScale = 1,
}) {
  const duration = PUSH_DURATION_MS * timeScale;
  const travel = computePushTravel(viewportW, viewportH);
  const promises = [];

  tileEntries.forEach((entry, i) => {
    if (i === selectedIndex) return;

    const { el, rect } = entry;

    // Kill the .stagger-children mount animation before driving this
    // tile ourselves — its fill-mode:both end value otherwise silently
    // overrides any WAAPI/inline transform we set.
    el.style.animation = "none";
    el.style.willChange = "transform, opacity";

    const dir = computePushDirection(rect, pivot, (i / tileEntries.length) * Math.PI * 2);
    const tx = dir.x * travel;
    const ty = dir.y * travel;

    const anim = el.animate(
      [
        { transform: "translate(0px, 0px) scale(1)", opacity: 1 },
        { transform: `translate(${tx}px, ${ty}px) scale(${PART_SHRINK_SCALE})`, opacity: 0 },
      ],
      { duration, easing: PART_EASING, fill: "forwards" },
    );
    animationsRef.current.push(anim);
    promises.push(anim.finished.catch(() => {}));
  });

  return Promise.all(promises).then(() => {});
}
