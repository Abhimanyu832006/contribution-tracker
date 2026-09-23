import { buildNonSelectedKeyframes } from "@/lib/moduleOrbitMath";

/**
 * Total duration of the non-selected tiles' morph (compress → orbit →
 * fade). Runs concurrently with the selected clone's pre-maximize morph
 * which shares the same duration and stage fractions, so the two look
 * like ONE animation of six cards until the fade-vs-emerge split at the
 * very end.
 */
export const NON_SELECTED_DURATION_MS = 1050;

/**
 * Total radians swept during the orbit stage — full one-and-a-bit
 * rotation so it reads as continuous rotational motion, not a hop.
 */
const ORBIT_SWEEP_RAD = 1.15 * 2 * Math.PI;

/**
 * Drives the 5 non-selected real tiles' continuous morph (compress →
 * orbit → fade). Also runs a short glow highlight on the selected tile's
 * real element — but that's a no-op the moment the provider hides it and
 * mounts the clone (which happens synchronously at click time), so this
 * shadow is only visible if something aborts before the clone mounts.
 *
 * Returns a promise that resolves once EVERY non-selected tile's own
 * animation has finished (they share one duration, so all finish
 * together — awaiting any one is equivalent).
 */
export function runNonSelectedMorph({
  tileEntries,
  selectedIndex,
  pivot,
  radius,
  targetAngles,
  perTileScale,
  animationsRef,
  timeScale = 1,
}) {
  const duration = NON_SELECTED_DURATION_MS * timeScale;

  const promises = [];

  tileEntries.forEach((entry, i) => {
    if (i === selectedIndex) {
      // The selected tile's real element is hidden by the provider (the
      // clone in the portal handles its full motion), so we don't animate
      // it here at all. Ignoring it also avoids fighting the visibility
      // change during the tile's own registered animations list cleanup.
      return;
    }

    const { el, rect } = entry;
    const cx0 = rect.left + rect.width / 2;
    const cy0 = rect.top + rect.height / 2;
    const angle0 = Math.atan2(cy0 - pivot.y, cx0 - pivot.x);
    const radius0 = Math.hypot(cx0 - pivot.x, cy0 - pivot.y) || 1;

    // Kill the .stagger-children mount animation before driving this tile
    // ourselves — its fill-mode:both end value otherwise silently
    // overrides any WAAPI/inline transform we set.
    el.style.animation = "none";
    el.style.willChange = "transform, opacity";

    const keyframes = buildNonSelectedKeyframes({
      angle0,
      radius0,
      cx0,
      cy0,
      targetAngle: targetAngles[i],
      radius,
      pivot,
      orbitSweep: ORBIT_SWEEP_RAD,
      compressScale: perTileScale ? perTileScale[i] : 0.78,
    });

    const anim = el.animate(keyframes, {
      duration,
      easing: "linear",
      fill: "forwards",
    });
    animationsRef.current.push(anim);
    promises.push(anim.finished.catch(() => {}));
  });

  return Promise.all(promises).then(() => {});
}
