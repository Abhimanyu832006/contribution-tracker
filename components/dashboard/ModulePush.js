import { computePushDirection, computePushTravel } from "@/lib/moduleTransitionMath";

/**
 * How long the non-selected tiles take to clear the viewport. Runs
 * concurrently with the selected tile's expansion (see ModuleTransition
 * .js) — both start at the same instant, so the whole thing reads as one
 * motion: the clicked card takes over the screen while its siblings are
 * shoved out of the way, not two separate sequential steps.
 */
export const PUSH_DURATION_MS = 480;

/**
 * Pushes every non-selected tile radially away from the clicked tile's
 * center until it clears the viewport — the "layout displacement" half
 * of the Tizen-style app-launch pattern: siblings don't fade or spin in
 * place, they're shoved off to the edges to clear the stage.
 *
 * Each tile is one WAAPI animation: a straight-line translate (native
 * easing handles the curve — no manual sampling needed for a 2-point
 * path) with opacity fading in step, using the same fast-out easing as
 * the clicked tile's expansion so both halves of the motion accelerate
 * together instead of the expansion visibly racing ahead.
 *
 * @returns {Promise<void>} resolves once every sibling's push animation
 *   has finished.
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

    // Same easing as the clicked tile's expansion (ModuleTransition.js)
    // so both halves of the motion accelerate together from the first
    // frame — a coordinated "shove" rather than the expansion visibly
    // racing ahead of a slower-starting push.
    const anim = el.animate(
      [
        { transform: "translate(0px, 0px)", opacity: 1 },
        { transform: `translate(${tx}px, ${ty}px)`, opacity: 0 },
      ],
      { duration, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" },
    );
    animationsRef.current.push(anim);
    promises.push(anim.finished.catch(() => {}));
  });

  return Promise.all(promises).then(() => {});
}
