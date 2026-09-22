import Link from "next/link";
import { requireProject } from "@/lib/auth";
import pool from "@/lib/db";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";

export const metadata = {
  title: "Dashboard — Contribution Tracker",
};

function timeAgo(iso) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default async function DashboardPage() {
  const session = await requireProject();
  const projectId = session.user.projectId;

  const { rows: projectRows } = await pool.query(
    "SELECT name, repo_owner, repo_name FROM projects WHERE id = $1",
    [projectId]
  );
  const project = projectRows[0];

  const { rows: members } = await pool.query(
    `SELECT
       u.id, u.github_username, u.avatar_url, pm.role,
       COALESCE(SUM(c.time_estimate), 0)::float AS total_hours,
       COUNT(c.id)::int AS contribution_count,
       MAX(c.created_at) AS last_active
     FROM project_members pm
     JOIN users u ON u.id = pm.user_id
     LEFT JOIN contributions c ON c.user_id = u.id AND c.project_id = pm.project_id
     WHERE pm.project_id = $1
     GROUP BY u.id, pm.role
     ORDER BY total_hours DESC`,
    [projectId]
  );

  const { rows: entries } = await pool.query(
    `SELECT
       c.id, c.category, c.description, c.time_estimate, c.status, c.source,
       c.commit_url, c.created_at, u.github_username, u.avatar_url
     FROM contributions c
     JOIN users u ON u.id = c.user_id
     WHERE c.project_id = $1
     ORDER BY c.created_at DESC
     LIMIT 8`,
    [projectId]
  );

  const { rows: countRows } = await pool.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE source = 'github')::int AS github,
       COUNT(*) FILTER (WHERE source = 'manual')::int AS manual,
       COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
       COUNT(*) FILTER (WHERE status IN ('verified','approved'))::int AS verified,
       COUNT(*) FILTER (WHERE status = 'flagged')::int AS flagged,
       COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::int AS this_week
     FROM contributions WHERE project_id = $1`,
    [projectId]
  );
  const counts = countRows[0];

  const { rows: categoryBreakdown } = await pool.query(
    `SELECT category, COUNT(*)::int AS count FROM contributions
     WHERE project_id = $1 GROUP BY category ORDER BY count DESC LIMIT 6`,
    [projectId]
  );

  const totalHours = members.reduce((sum, m) => sum + m.total_hours, 0);
  const maxMemberHours = Math.max(...members.map((m) => m.total_hours), 1);
  const maxCategoryCount = Math.max(...categoryBreakdown.map((c) => c.count), 1);
  const githubPct = counts.total ? (counts.github / counts.total) * 100 : 0;

  return (
    <div className="space-y-14">
      {/* ── Masthead ──────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <h1 className="font-[family-name:var(--font-poster)] text-5xl sm:text-6xl leading-[0.85] tracking-tight">
          {project?.name}
        </h1>
        {project?.repo_owner && project?.repo_name ? (
          <a
            href={`https://github.com/${project.repo_owner}/${project.repo_name}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 font-mono text-xs text-[#55503f] hover:text-[#0e0d0b] shrink-0 mb-1"
          >
            <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse-block" />
            {project.repo_owner}/{project.repo_name}
          </a>
        ) : (
          <Link href="/settings" className="flex items-center gap-2 font-mono text-xs text-[#928c78] hover:text-[#0e0d0b] shrink-0 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#928c78]" />
            no repository linked
          </Link>
        )}
      </div>

      {/* ── Hero row: a solid color block hero number + stat column ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-5">
        <div
          className="rounded-[3px] border-2 border-[#0e0d0b] shadow-[6px_6px_0_0_rgba(14,13,11,0.9)] p-8 sm:p-10 flex flex-col justify-between min-h-[220px]"
          style={{ backgroundColor: "#ff4713" }}
        >
          <p className="font-mono text-xs uppercase tracking-wider text-[#0e0d0b]/70">
            This week
          </p>
          <p className="font-[family-name:var(--font-poster)] text-[6rem] sm:text-[7.5rem] leading-[0.8] text-[#0e0d0b] animate-count-in">
            {counts.this_week}
          </p>
          <p className="text-sm text-[#0e0d0b]/80">
            contribution{counts.this_week === 1 ? "" : "s"} logged
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <Card className="flex flex-col justify-between">
            <p className="label-mono">Total</p>
            <p className="stat-num text-5xl mt-2">{counts.total}</p>
          </Card>
          <Card className="flex flex-col justify-between">
            <p className="label-mono">Hours</p>
            <p className="stat-num text-5xl mt-2">{totalHours.toFixed(0)}</p>
          </Card>
          <Card className="flex flex-col justify-between">
            <p className="label-mono">Team</p>
            <p className="stat-num text-5xl mt-2">{members.length}</p>
          </Card>
          <Link href="/peer-verification">
            <Card
              hover
              accent={counts.pending > 0 ? "pending" : "verified"}
              className="flex flex-col justify-between h-full"
            >
              <p className="label-mono">To review</p>
              <p
                className="stat-num text-5xl mt-2"
                style={{ color: counts.pending > 0 ? "var(--color-pending)" : "var(--color-verified)" }}
              >
                {counts.pending}
              </p>
            </Card>
          </Link>
        </div>
      </div>

      {/* ── GitHub / Manual split — a real bar, both segments solid color ── */}
      {counts.total > 0 && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <p className="label-mono">Signal / Work split</p>
            <p className="font-mono text-xs text-[#55503f]">
              {counts.github} github · {counts.manual} manual
            </p>
          </div>
          <div className="flex h-14 rounded-[3px] overflow-hidden border-2 border-[#0e0d0b]">
            {counts.github > 0 && (
              <div
                className="flex items-center px-4 shrink-0"
                style={{ width: `${githubPct}%`, backgroundColor: "#1a3fd6" }}
              >
                {githubPct > 12 && (
                  <span className="font-mono text-sm font-semibold text-[#f4f2ec]">
                    {Math.round(githubPct)}%
                  </span>
                )}
              </div>
            )}
            {counts.manual > 0 && (
              <div
                className="flex items-center px-4 flex-1"
                style={{ backgroundColor: "#ff4713" }}
              >
                {100 - githubPct > 12 && (
                  <span className="font-mono text-sm font-semibold text-[#0e0d0b]">
                    {Math.round(100 - githubPct)}%
                  </span>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Team activity — bold horizontal bars, real hours ─────── */}
      {members.length > 0 && (
        <section>
          <p className="label-mono mb-3">Team activity</p>
          <div className="space-y-2.5">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3">
                <Avatar src={m.avatar_url} name={m.github_username} size="sm" />
                <span className="text-sm font-semibold w-28 sm:w-36 truncate shrink-0">
                  {m.github_username}
                </span>
                <div className="flex-1 h-6 bg-[#e8e5db] rounded-[2px] relative overflow-hidden">
                  <div
                    className="h-full rounded-[2px] transition-all duration-500"
                    style={{
                      width: `${(m.total_hours / maxMemberHours) * 100}%`,
                      backgroundColor: m.role === "leader" ? "#0e0d0b" : "#1a3fd6",
                      minWidth: m.total_hours > 0 ? "6px" : "0",
                    }}
                  />
                </div>
                <span className="font-mono text-xs text-[#55503f] w-14 text-right shrink-0">
                  {m.total_hours.toFixed(1)}h
                </span>
                <span className="font-mono text-[10px] text-[#928c78] w-16 text-right shrink-0 hidden sm:block">
                  {m.contribution_count > 0 ? timeAgo(m.last_active) : "—"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Category breakdown — solid blocks sized by count ─────── */}
      {categoryBreakdown.length > 0 && (
        <section>
          <p className="label-mono mb-3">By category</p>
          <div className="flex flex-wrap gap-2">
            {categoryBreakdown.map((cat, i) => (
              <div
                key={cat.category}
                className="rounded-[3px] border-2 border-[#0e0d0b] px-4 py-3 flex items-end gap-2"
                style={{
                  backgroundColor: i === 0 ? "#0e0d0b" : "#ffffff",
                  color: i === 0 ? "#f4f2ec" : "#0e0d0b",
                  minWidth: `${80 + (cat.count / maxCategoryCount) * 100}px`,
                }}
              >
                <span className="stat-num text-2xl">{cat.count}</span>
                <span className="font-mono text-[10px] uppercase tracking-wider pb-0.5">
                  {cat.category}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Activity stream — recent events as split-block cards ─── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="label-mono">Recent activity</p>
          <Link href="/contributions" className="font-mono text-xs text-[#1a3fd6] hover:underline">
            View all →
          </Link>
        </div>

        {entries.length === 0 ? (
          <div className="border-2 border-dashed border-[#928c78] rounded-[3px] py-16 text-center">
            <p className="text-sm text-[#928c78]">Nothing recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-3 stagger-children">
            {entries.map((e) => (
              <ActivityRow key={e.id} entry={e} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/** One contribution as a split-block row: a solid color spine tags the
 * source (signal-blue = GitHub, work-orange = manual), fused to a plain
 * content panel. Verified/flagged get a solid stamp; pending gets nothing
 * loud — it hasn't been judged yet. */
function ActivityRow({ entry }) {
  const isGithub = entry.source === "github";
  const spineColor = isGithub ? "#1a3fd6" : "#ff4713";
  const stamp =
    entry.status === "flagged"
      ? { bg: "#e11d2e", fg: "#f4f2ec", label: "flagged" }
      : entry.status === "verified" || entry.status === "approved"
      ? { bg: "#16a34a", fg: "#f4f2ec", label: "verified" }
      : null;

  const href = isGithub && entry.commit_url ? entry.commit_url : `/contributions/${entry.id}`;
  const linkProps = isGithub && entry.commit_url ? { target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <Link
      href={href}
      {...linkProps}
      className="flex rounded-[3px] border-2 border-[#0e0d0b] overflow-hidden bg-white transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_rgba(14,13,11,0.9)]"
    >
      <div
        className="w-2 sm:w-3 shrink-0"
        style={{ backgroundColor: spineColor }}
      />
      <div className="flex-1 flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-3 min-w-0">
        <Avatar src={entry.avatar_url} name={entry.github_username} size="sm" className="shrink-0" />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold">{entry.github_username}</span>
            <span
              className="font-mono text-[10px] uppercase tracking-wider"
              style={{ color: spineColor }}
            >
              {isGithub ? "github" : entry.category}
            </span>
          </div>
          <p className={`truncate ${isGithub ? "font-mono text-[13px] text-[#55503f]" : "font-serif text-[15px]"}`}>
            {entry.description}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          {!isGithub && entry.time_estimate > 0 && (
            <span className="font-mono text-sm hidden sm:inline">{Number(entry.time_estimate).toFixed(1)}h</span>
          )}
          {stamp && (
            <span
              className="stamp-solid"
              style={{ backgroundColor: stamp.bg, color: stamp.fg }}
            >
              {stamp.label}
            </span>
          )}
          <span className="font-mono text-[10px] text-[#928c78] hidden md:inline">
            {timeAgo(entry.created_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}
