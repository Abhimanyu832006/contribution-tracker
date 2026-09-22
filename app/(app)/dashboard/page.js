import { requireProject } from "@/lib/auth";
import pool from "@/lib/db";
import TeamMemberCard from "@/components/TeamMemberCard";
import ContributionList from "@/components/ContributionList";

export const metadata = {
  title: "Dashboard — Contribution Tracker",
};

function pad(n) {
  return String(n).padStart(3, "0");
}

export default async function DashboardPage() {
  const session = await requireProject();
  const projectId = session.user.projectId;

  const { rows: projectRows } = await pool.query(
    "SELECT name, repo_owner, repo_name FROM projects WHERE id = $1",
    [projectId]
  );
  const project = projectRows[0];

  // Fetch team members with hours
  const { rows: members } = await pool.query(
    `SELECT
       u.id,
       u.github_username,
       u.avatar_url,
       pm.role,
       COALESCE(SUM(c.time_estimate), 0) AS total_hours,
       COUNT(c.id) AS contribution_count
     FROM project_members pm
     JOIN users u ON u.id = pm.user_id
     LEFT JOIN contributions c ON c.user_id = u.id AND c.project_id = pm.project_id
     WHERE pm.project_id = $1
     GROUP BY u.id, pm.role
     ORDER BY total_hours DESC`,
    [projectId]
  );

  // Fetch recent contributions
  const { rows: contributions } = await pool.query(
    `SELECT
       c.id,
       c.category,
       c.description,
       c.time_estimate,
       c.status,
       c.source,
       c.attachment_url,
       c.attachment_name,
       c.attachment_size,
       c.attachment_type,
       c.created_at,
       u.github_username,
       u.avatar_url
     FROM contributions c
     JOIN users u ON u.id = c.user_id
     WHERE c.project_id = $1
     ORDER BY c.created_at DESC
     LIMIT 10`,
    [projectId]
  );

  // Breakdown by source (GitHub vs Manual)
  const { rows: sourceBreakdown } = await pool.query(
    `SELECT
       source,
       COUNT(*)::int AS count
     FROM contributions
     WHERE project_id = $1
     GROUP BY source`,
    [projectId]
  );

  // Breakdown by verification status
  const { rows: statusBreakdown } = await pool.query(
    `SELECT
       status,
       COUNT(*)::int AS count
     FROM contributions
     WHERE project_id = $1
     GROUP BY status`,
    [projectId]
  );

  // Breakdown by category
  const { rows: categoryBreakdown } = await pool.query(
    `SELECT
       category,
       COUNT(*)::int AS count
     FROM contributions
     WHERE project_id = $1
     GROUP BY category
     ORDER BY count DESC`,
    [projectId]
  );

  // Summary stats
  const totalHours = members.reduce(
    (sum, m) => sum + Number(m.total_hours),
    0
  );
  const totalContributions = members.reduce(
    (sum, m) => sum + Number(m.contribution_count),
    0
  );

  const githubCount = sourceBreakdown.find((s) => s.source === "github")?.count || 0;
  const manualCount = sourceBreakdown.find((s) => s.source === "manual")?.count || 0;
  const pendingCount = statusBreakdown.find((s) => s.status === "pending")?.count || 0;
  const verifiedCount =
    (statusBreakdown.find((s) => s.status === "verified")?.count || 0) +
    (statusBreakdown.find((s) => s.status === "approved")?.count || 0);
  const flaggedCount = statusBreakdown.find((s) => s.status === "flagged")?.count || 0;

  return (
    <div className="space-y-12">
      {/* Page header — editorial masthead, not a generic page title */}
      <div className="rule-strong-b pb-5">
        <p className="label-mono mb-2">DASHBOARD / {project?.name?.toUpperCase()}</p>
        <h1 className="font-serif text-4xl sm:text-5xl leading-none">
          {project?.name}
        </h1>
        {project?.repo_owner && project?.repo_name ? (
          <p className="font-mono text-xs text-[#4a473f] mt-3">
            {project.repo_owner}/{project.repo_name}
          </p>
        ) : (
          <p className="label-mono mt-3">NO REPOSITORY LINKED</p>
        )}
      </div>

      {/* Primary figures — large serif numerals, vertical rules, no cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4">
        {[
          { label: "TEAM", value: pad(members.length) },
          { label: "HOURS LOGGED", value: totalHours.toFixed(1) },
          { label: "CONTRIBUTIONS", value: pad(totalContributions) },
          { label: "VERIFIED", value: pad(verifiedCount) },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className={`py-4 ${i > 0 ? "sm:rule-l sm:pl-6" : ""} ${
              i % 2 === 1 ? "rule-l pl-6 sm:pl-6" : ""
            } rule-t`}
          >
            <p className="stat-num text-5xl sm:text-6xl">{stat.value}</p>
            <p className="label-mono mt-2">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Source / status breakdowns — horizontal rule bars, not progress pills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
        <section>
          <p className="label-mono rule-b pb-2 mb-3">CONTRIBUTION SOURCE</p>
          <div className="space-y-2.5">
            <BreakdownRow label="GitHub" count={githubCount} total={totalContributions} />
            <BreakdownRow label="Manual" count={manualCount} total={totalContributions} />
          </div>
        </section>

        <section>
          <p className="label-mono rule-b pb-2 mb-3">VERIFICATION STATUS</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="stat-num text-3xl text-[#7a5c00]">{pad(pendingCount)}</p>
              <p className="label-mono mt-1">PENDING</p>
            </div>
            <div>
              <p className="stat-num text-3xl text-[#2c4a2e]">{pad(verifiedCount)}</p>
              <p className="label-mono mt-1">VERIFIED</p>
            </div>
            <div>
              <p className="stat-num text-3xl text-[#b3271e]">{pad(flaggedCount)}</p>
              <p className="label-mono mt-1">FLAGGED</p>
            </div>
          </div>
        </section>
      </div>

      {/* Category breakdown */}
      {categoryBreakdown.length > 0 && (
        <section>
          <p className="label-mono rule-b pb-2 mb-3">CONTRIBUTIONS BY CATEGORY</p>
          <div className="space-y-2.5">
            {categoryBreakdown.map((cat) => (
              <BreakdownRow
                key={cat.category}
                label={cat.category}
                count={cat.count}
                total={totalContributions}
              />
            ))}
          </div>
        </section>
      )}

      {/* Team roster */}
      <section>
        <p className="label-mono rule-b pb-2 mb-4">TEAM ROSTER</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m) => (
            <TeamMemberCard key={m.id} member={m} />
          ))}
        </div>
      </section>

      {/* Recent activity */}
      <section>
        <p className="label-mono rule-b pb-2 mb-4">RECENT ACTIVITY</p>
        <ContributionList contributions={contributions} />
      </section>
    </div>
  );
}

/** Editorial horizontal-rule breakdown row — replaces colored progress pills. */
function BreakdownRow({ label, count, total }) {
  const pct = total ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-mono text-xs text-[#4a473f]">
          {count} · {pct.toFixed(0)}%
        </span>
      </div>
      <div className="h-px w-full bg-[rgba(20,19,17,0.14)] relative">
        <div
          className="h-px bg-[#141311] absolute inset-y-0 left-0"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
