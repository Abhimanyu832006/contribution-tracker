import Link from "next/link";
import { requireProject } from "@/lib/auth";
import pool from "@/lib/db";

export const metadata = {
  title: "Dashboard — Contribution Tracker",
};

function dayLabel(iso) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(d, today)) return "TODAY";
  if (sameDay(d, yesterday)) return "YESTERDAY";
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" }).toUpperCase();
}

function timeOfDay(iso) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

export default async function DashboardPage() {
  const session = await requireProject();
  const projectId = session.user.projectId;

  const { rows: projectRows } = await pool.query(
    "SELECT name, repo_owner, repo_name, created_at FROM projects WHERE id = $1",
    [projectId]
  );
  const project = projectRows[0];

  // Team, with hours — used for the contributors line + the "who's quiet" signal
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

  // The logbook — everything recorded, most recent first
  const { rows: entries } = await pool.query(
    `SELECT
       c.id, c.category, c.description, c.time_estimate, c.status, c.source,
       c.commit_url, c.created_at, u.github_username, u.avatar_url
     FROM contributions c
     JOIN users u ON u.id = c.user_id
     WHERE c.project_id = $1
     ORDER BY c.created_at DESC
     LIMIT 18`,
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
     WHERE project_id = $1 GROUP BY category ORDER BY count DESC LIMIT 4`,
    [projectId]
  );

  const totalHours = members.reduce((sum, m) => sum + m.total_hours, 0);
  const topCategory = categoryBreakdown[0];
  const githubPct = counts.total ? Math.round((counts.github / counts.total) * 100) : 0;

  // Group the logbook entries by calendar day
  const grouped = [];
  for (const e of entries) {
    const label = dayLabel(e.created_at);
    let bucket = grouped.find((g) => g.label === label);
    if (!bucket) {
      bucket = { label, items: [] };
      grouped.push(bucket);
    }
    bucket.items.push(e);
  }

  // Quietest active member — a human signal, not a leaderboard
  const quietest = members
    .filter((m) => m.contribution_count > 0)
    .sort((a, b) => new Date(a.last_active) - new Date(b.last_active))[0];

  return (
    <div className="space-y-16">
      {/* ── Masthead ──────────────────────────────────────────── */}
      <div>
        <p className="font-mono text-xs text-[#96907a] mb-1">
          {project?.repo_owner && project?.repo_name
            ? `${project.repo_owner}/${project.repo_name}`
            : "no repository linked"}
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl leading-none">{project?.name}</h1>
      </div>

      {/* ── Hero: this week's momentum, asymmetric, not a stat grid ── */}
      <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">
        <div className="shrink-0">
          <p className="stat-num text-[7rem] sm:text-[9rem] text-[#1c1a15]">
            {counts.this_week}
          </p>
          <p className="font-mono text-xs text-[#55503f] -mt-3">
            entr{counts.this_week === 1 ? "y" : "ies"} logged this week
          </p>
        </div>

        {/* Marginalia — deliberately unequal sizes, not a matching grid */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-6 pt-2 lg:pt-4">
          <div>
            <p className="stat-num text-3xl">{counts.total}</p>
            <p className="text-xs text-[#96907a] mt-0.5">contributions, total</p>
          </div>
          <div>
            <p className="stat-num text-2xl">{totalHours.toFixed(1)}</p>
            <p className="text-xs text-[#96907a] mt-0.5">hours logged</p>
          </div>
          <div>
            <p className="stat-num text-2xl">{members.length}</p>
            <p className="text-xs text-[#96907a] mt-0.5">on the team</p>
          </div>
          <div>
            <p className="stat-num text-2xl" style={{ color: "var(--color-pending)" }}>
              {counts.pending}
            </p>
            <p className="text-xs text-[#96907a] mt-0.5">awaiting review</p>
          </div>
          <div>
            <p className="stat-num text-2xl" style={{ color: "var(--color-stamp-approve)" }}>
              {counts.verified}
            </p>
            <p className="text-xs text-[#96907a] mt-0.5">verified</p>
          </div>
          {counts.flagged > 0 && (
            <div>
              <p className="stat-num text-2xl" style={{ color: "var(--color-stamp)" }}>
                {counts.flagged}
              </p>
              <p className="text-xs text-[#96907a] mt-0.5">flagged</p>
            </div>
          )}
        </div>
      </div>

      {/* ── The read-out: a sentence, not a chart ────────────────
          Data becomes prose because a proportion is easier to feel
          in a sentence than to decode from a bar. */}
      {counts.total > 0 && (
        <p className="text-lg leading-relaxed max-w-2xl font-serif text-[#1c1a15] border-l-2 pl-6" style={{ borderColor: "var(--color-human)" }}>
          <span style={{ color: "var(--color-system)" }}>{githubPct}%</span> of the recorded
          work has arrived as GitHub commits; the rest was written in by hand
          {topCategory ? (
            <>
              , mostly <span style={{ color: "var(--color-human)" }}>{topCategory.category.toLowerCase()}</span>
            </>
          ) : null}
          .{" "}
          {quietest && (
            <span className="text-[#55503f]">
              @{quietest.github_username} hasn&apos;t logged anything since{" "}
              {new Date(quietest.last_active).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}.
            </span>
          )}
        </p>
      )}

      {/* ── The logbook ───────────────────────────────────────── */}
      <section>
        <p className="font-mono text-xs text-[#96907a] mb-5 uppercase tracking-wide">The Log</p>

        {grouped.length === 0 ? (
          <div className="border border-dashed border-[rgba(28,26,21,0.25)] py-16 text-center">
            <p className="text-sm text-[#96907a]">Nothing recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {grouped.map((day) => (
              <div key={day.label} className="flex gap-6">
                <p className="font-mono text-[11px] text-[#96907a] w-20 shrink-0 pt-1">
                  {day.label}
                </p>
                <div className="flex-1 space-y-4 min-w-0">
                  {day.items.map((e) =>
                    e.source === "github" ? (
                      <SystemLine key={e.id} entry={e} />
                    ) : (
                      <JournalEntry key={e.id} entry={e} />
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Contributors — a masthead credit line, not profile cards ── */}
      <section className="rule-t pt-6">
        <p className="font-mono text-xs text-[#96907a] mb-3 uppercase tracking-wide">On this project</p>
        <p className="text-sm leading-loose">
          {members.map((m, i) => (
            <span key={m.id}>
              <Link href="/settings" className="hover:underline decoration-[var(--color-human)]">
                {m.github_username}
              </Link>
              <span className="text-[#96907a]">
                {" "}({m.total_hours.toFixed(1)}h{m.role === "leader" ? ", leads" : ""})
              </span>
              {i < members.length - 1 ? <span className="text-[#96907a]"> · </span> : null}
            </span>
          ))}
        </p>
      </section>
    </div>
  );
}

/** GitHub commit — a terminal log line. Terse, teal, monospace. */
function SystemLine({ entry }) {
  const content = (
    <div className="flex items-baseline gap-3 font-mono text-[13px] group">
      <span className="text-[#96907a] shrink-0">{timeOfDay(entry.created_at)}</span>
      <span style={{ color: "var(--color-system)" }} className="shrink-0">
        {entry.github_username}
      </span>
      <span className="text-[#1c1a15] truncate group-hover:underline">
        {entry.description}
      </span>
    </div>
  );
  return entry.commit_url ? (
    <a href={entry.commit_url} target="_blank" rel="noopener noreferrer" className="block">
      {content}
    </a>
  ) : (
    content
  );
}

/** Manual entry — someone wrote this. Serif, generous, a real sentence. */
function JournalEntry({ entry }) {
  const stampColor =
    entry.status === "flagged"
      ? "var(--color-stamp)"
      : entry.status === "verified" || entry.status === "approved"
      ? "var(--color-stamp-approve)"
      : null;

  return (
    <Link href={`/contributions/${entry.id}`} className="block group">
      <p className="font-serif text-[17px] leading-snug text-[#1c1a15]">
        <span style={{ color: "var(--color-human)" }} className="not-italic">
          {entry.github_username}
        </span>{" "}
        <span className="text-[#55503f] text-sm font-sans">— {entry.category.toLowerCase()}</span>
        {" · "}
        <span className="group-hover:underline decoration-[rgba(28,26,21,0.3)]">
          {entry.description}
        </span>
        {entry.time_estimate > 0 && (
          <span className="font-mono text-xs text-[#96907a]"> ({Number(entry.time_estimate).toFixed(1)}h)</span>
        )}
        {stampColor && (
          <span
            className="rubber-stamp rubber-stamp--flat ml-2 align-middle text-[9px]"
            style={{ color: stampColor }}
          >
            {entry.status === "flagged" ? "flagged" : "verified"}
          </span>
        )}
      </p>
    </Link>
  );
}
