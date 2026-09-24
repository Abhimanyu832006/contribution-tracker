"use client";

/**
 * Modern loading screen shown for EVERY in-app navigation — a neutral
 * card with a small tinted icon badge, soft shadow, matching the rest
 * of the app's restrained, contemporary design system. Dashboard tile
 * clicks pass their own icon/accent/accentLight/label for a richer,
 * module-specific look; every other in-app link (caught by the global
 * click listener in NavigationLoadingProvider.js) gets a generic icon
 * and the app's primary accent. No shared-element illusion here: the
 * overlay just covers the screen immediately and gets out of the way
 * once the destination is actually ready.
 */

// Staggered start times across the audio-wave bars — a symmetric
// ripple (outer bars lag the center) reads as a smoother, more natural
// "wave" than a straight left-to-right sweep.
const WAVE_BAR_DELAYS = [0.4, 0.2, 0, 0.2, 0.4];

export function NavigationLoadingOverlay({ label, icon, accent, accentLight, overlayRef }) {
  return (
    <div
      ref={overlayRef}
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "var(--color-bg)",
      }}
      className="flex items-center justify-center"
    >
      <div className="brutal-card p-6 sm:p-7" style={{ width: "min(90vw, 360px)" }}>
        <div className="flex items-center gap-3">
          <span
            className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl"
            style={{ background: accentLight }}
          >
            <svg
              className="w-5.5 h-5.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke={accent}
              strokeWidth={1.75}
            >
              {icon}
            </svg>
          </span>
          <div className="min-w-0">
            <p className="label-mono text-[var(--color-text-muted)]">Opening</p>
            <p className="text-lg font-bold text-[var(--color-text-primary)] truncate">{label}</p>
          </div>
        </div>

        <div className="mt-5 flex items-end justify-center gap-1.5 h-6">
          {WAVE_BAR_DELAYS.map((delay, i) => (
            <div
              key={i}
              className="audio-wave-bar w-2 h-full"
              style={{ background: accent, animationDelay: `${delay}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
