"use client";

/**
 * Neo-brutalist loading screen shown while a clicked module's
 * destination loads underneath it — thick borders, hard offset shadow,
 * flat color blocks, no blur, matching the rest of the app's design
 * system. No shared-element illusion here: the overlay just covers the
 * screen immediately and gets out of the way once the destination is
 * actually ready (see ModuleTransitionProvider.js for the readiness
 * check that governs when it's safe to remove).
 */
export function ModuleLoadingOverlay({ tile, overlayRef }) {
  const textClass = tile.textLight ? "text-[var(--color-ink-fg)]" : "text-black";

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
            className="w-11 h-11 shrink-0 flex items-center justify-center border-2 border-[var(--color-border)] rounded-xl"
            style={{ background: tile.accent, boxShadow: "var(--shadow-brutal-sm)" }}
          >
            <svg
              className={`w-5.5 h-5.5 ${textClass}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
            >
              {tile.icon}
            </svg>
          </span>
          <div className="min-w-0">
            <p className="label-mono text-[var(--color-text-muted)]">Opening</p>
            <p className="text-lg font-black uppercase tracking-tight truncate">{tile.label}</p>
          </div>
        </div>

        <div
          className="mt-5 relative overflow-hidden border-2 border-[var(--color-border)]"
          style={{ height: 18, background: "var(--color-surface)", borderRadius: 8 }}
        >
          <div
            className="loading-bar-sweep absolute top-0 bottom-0 border-r-2 border-[var(--color-border)]"
            style={{ width: "38%", background: tile.accent }}
          />
        </div>
      </div>
    </div>
  );
}
