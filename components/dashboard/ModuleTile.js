"use client";

import Link from "next/link";

/**
 * A single bento tile — pure presentation. No ref forwarding needed;
 * the loading-overlay transition model doesn't measure tile geometry.
 *
 * Modern dashboard treatment: a neutral card with a small tinted icon
 * badge carrying the module's color, not a full-bleed colored fill —
 * color used as an accent, not a background. The one exception is a
 * `cta` tile (Log Contribution), which stays a bold filled card since
 * it's meant to read as the dashboard's one primary action among
 * otherwise neutral info cards.
 */
export default function ModuleTile({ tile, onClick }) {
  if (tile.cta) {
    return (
      <Link
        href={tile.href}
        onClick={onClick}
        className={`brutal-tile overflow-hidden flex flex-col justify-between p-4 sm:p-5 ${tile.big}`}
        style={{ background: tile.accent, borderColor: "transparent" }}
      >
        <div className="flex items-center justify-between">
          <svg
            className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--color-ink-fg)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
          >
            {tile.icon}
          </svg>
          <svg
            className="w-4 h-4 text-[var(--color-ink-fg)]/60"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
        <div>
          {tile.stat !== null && (
            <p className="stat-num text-3xl sm:text-4xl text-[var(--color-ink-fg)]">{tile.stat}</p>
          )}
          <p className="text-sm font-semibold text-[var(--color-ink-fg)] mt-0.5">{tile.label}</p>
          <p className="text-xs mt-0.5 truncate text-[var(--color-ink-fg)]/70">
            {tile.sub || tile.statLabel}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={tile.href}
      onClick={onClick}
      className={`brutal-tile overflow-hidden flex flex-col justify-between p-4 sm:p-5 ${tile.big}`}
    >
      <div className="flex items-center justify-between">
        <span
          className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center"
          style={{ background: tile.accentLight }}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke={tile.accent}
            strokeWidth={1.75}
          >
            {tile.icon}
          </svg>
        </span>
        <svg
          className="w-4 h-4 text-[var(--color-text-muted)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>
      <div>
        {tile.stat !== null && (
          <p className="stat-num text-3xl sm:text-4xl text-[var(--color-text-primary)]">
            {tile.stat}
          </p>
        )}
        <p className="text-sm font-semibold text-[var(--color-text-primary)] mt-0.5">
          {tile.label}
        </p>
        <p className="text-xs mt-0.5 truncate text-[var(--color-text-muted)]">
          {tile.sub || tile.statLabel}
        </p>
      </div>
    </Link>
  );
}
