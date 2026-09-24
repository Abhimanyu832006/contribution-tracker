"use client";

import Link from "next/link";
import Avatar from "@/components/ui/Avatar";

/**
 * A single bento tile — pure presentation. No ref forwarding needed;
 * the loading-overlay transition model doesn't measure tile geometry.
 *
 * Each module gets a barely-there tinted surface of its own accent
 * (see .module-tile-* in globals.css) rather than a full-bleed colored
 * fill — color used as an identity, not a background. The one
 * exception is a `cta` tile (Log Contribution), which stays a bold
 * filled card since it's meant to read as the dashboard's one primary
 * action among otherwise neutral-surfaced info cards.
 */
const MODULE_TILE_CLASS = {
  contributions: "module-tile-contributions",
  verification: "module-tile-verification",
  reports: "module-tile-reports",
  team: "module-tile-team",
  settings: "module-tile-settings",
};

const STATUS_META = {
  pending: { label: "In Review", color: "var(--color-warning)", light: "var(--color-warning-light)" },
  verified: { label: "Verified", color: "var(--color-success)", light: "var(--color-success-light)" },
  approved: { label: "Verified", color: "var(--color-success)", light: "var(--color-success-light)" },
  flagged: { label: "Flagged", color: "var(--color-danger)", light: "var(--color-danger-light)" },
};

function timeAgo(iso) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** A 7-day mini streak strip — GitHub-heatmap-flavored, comic-sized.
 * Each square's fill intensity reflects that day's contribution count. */
function StreakRow({ days, accent, accentLight }) {
  return (
    <div className="flex items-center gap-1" title="Last 7 days">
      {days.map((d) => (
        <span
          key={d.date}
          title={`${d.date}: ${d.count} contribution${d.count === 1 ? "" : "s"}`}
          className="w-2.5 h-2.5 rounded-sm border border-[var(--color-border)]"
          style={{
            background: d.count === 0 ? "transparent" : d.count === 1 ? accentLight : accent,
          }}
        />
      ))}
    </div>
  );
}

/** Small overlapping avatar stack — used by the Team tile so its
 * generous row-span-1 footprint shows real faces, not just a count. */
function AvatarStack({ members, overflow }) {
  return (
    <div className="flex items-center -space-x-2 mt-2">
      {members.map((m) => (
        <Avatar
          key={m.id}
          src={m.avatar_url}
          name={m.github_username}
          size="xs"
          className="ring-2 ring-[var(--color-surface)]"
        />
      ))}
      {overflow > 0 && (
        <span
          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ring-2 ring-[var(--color-surface)] border border-[var(--color-border)]"
          style={{ background: "var(--color-team-light)", color: "var(--color-team)" }}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}

/** A thin segmented proportion bar — used by the Peer Verification tile
 * to show the pending/verified/flagged split at a glance instead of
 * just the pending count sitting alone in a mostly-empty card. */
function MiniBar({ segments }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) {
    return <div className="h-1.5 rounded-full mt-2.5 border border-[var(--color-border)]" />;
  }
  return (
    <div className="h-1.5 rounded-full overflow-hidden flex mt-2.5 border border-[var(--color-border)]">
      {segments.map(
        (s, i) =>
          s.value > 0 && (
            <span key={i} style={{ width: `${(s.value / total) * 100}%`, background: s.color }} />
          )
      )}
    </div>
  );
}

/** Compact comic-styled activity timeline, used only by the large
 * Contributions tile — fills the space that used to just sit empty. */
function ActivityStream({ items }) {
  return (
    <div className="flex-1 min-h-0 overflow-hidden flex flex-col justify-start pt-2 gap-2.5">
      {items.map((a) => {
        const meta = STATUS_META[a.status] || STATUS_META.pending;
        const isGithub = a.source === "github";
        return (
          <div key={a.id} className="flex items-center gap-2.5">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 border border-[var(--color-border)]"
              style={{ background: meta.color }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate text-[var(--color-text-primary)]">
                {a.description}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] truncate">
                {isGithub && a.commit_sha ? `#${a.commit_sha.slice(0, 7)}` : a.category} · {timeAgo(a.created_at)}
              </p>
            </div>
            <span
              className="shrink-0 text-xs font-bold uppercase px-1.5 py-0.5 rounded"
              style={{ background: meta.light, color: meta.color }}
            >
              {meta.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function ModuleTile({ tile, onClick }) {
  if (tile.cta) {
    return (
      <Link
        href={tile.href}
        onClick={onClick}
        className={`brutal-tile overflow-hidden flex flex-col justify-between p-4 sm:p-5 ${tile.big}`}
        style={{ background: tile.accent, borderColor: "transparent" }}
      >
        <div className="flex items-start justify-between">
          {/* One action icon, not two — a solid ink-colored badge (not
              a bare stroked "+") so it reads as a real button glyph. */}
          <span
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center"
            style={{ background: "var(--color-ink-fg)" }}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke={tile.accent} strokeWidth={2.25}>
              {tile.icon}
            </svg>
          </span>
          {/* High-contrast circular arrow badge instead of a low-contrast
              stroked arrow floating directly on the yellow fill. */}
          <span
            className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center"
            style={{ background: "var(--color-ink-fg)" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke={tile.accent} strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </span>
        </div>
        <div>
          <p className="text-lg sm:text-xl font-bold text-[var(--color-ink-fg)]">{tile.label}</p>
          <p className="text-sm font-semibold mt-1 text-[var(--color-ink-fg)]/80">
            {tile.sub || tile.statLabel}
          </p>
        </div>
      </Link>
    );
  }

  const moduleClass = MODULE_TILE_CLASS[tile.key] || "";

  return (
    <Link
      href={tile.href}
      onClick={onClick}
      className={`brutal-tile overflow-hidden flex flex-col justify-between p-4 sm:p-5 ${moduleClass} ${tile.big}`}
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
        {tile.streak?.length > 0 && (
          <StreakRow days={tile.streak} accent={tile.accent} accentLight={tile.accentLight} />
        )}
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
      {tile.activity?.length > 0 && <ActivityStream items={tile.activity} />}
      <div>
        {tile.stat !== null && (
          <p className="stat-num text-3xl sm:text-4xl" style={{ color: tile.accent }}>
            {tile.stat}
          </p>
        )}
        <p className="text-sm font-semibold text-[var(--color-text-primary)] mt-0.5">
          {tile.label}
        </p>
        <p className="text-sm font-semibold mt-0.5 truncate text-[var(--color-text-muted)]">
          {tile.sub || tile.statLabel}
        </p>
        {tile.avatars?.length > 0 && (
          <AvatarStack members={tile.avatars} overflow={tile.avatarOverflow || 0} />
        )}
        {tile.miniBar && <MiniBar segments={tile.miniBar} />}
        {tile.badge && (
          <span
            className="inline-block mt-2 text-xs font-bold px-1.5 py-0.5 rounded"
            style={{ background: tile.accentLight, color: tile.accent }}
          >
            {tile.badge}
          </span>
        )}
      </div>
    </Link>
  );
}
