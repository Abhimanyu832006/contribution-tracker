import { requireProject } from "@/lib/auth";
import pool from "@/lib/db";
import Card from "@/components/ui/Card";
import TeamMemberCard from "@/components/TeamMemberCard";
import ContributionList from "@/components/ContributionList";

export const metadata = {
  title: "Dashboard — Contribution Tracker",
};

export default async function DashboardPage() {
  const session = await requireProject();
  const projectId = session.user.projectId;

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
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of your team&apos;s project activity
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
        <Card>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Team Size
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {members.length}
          </p>
          <p className="text-xs text-gray-400 mt-1">members</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Total Hours
          </p>
          <p className="text-3xl font-bold text-indigo-600 mt-2">
            {totalHours.toFixed(1)}
          </p>
          <p className="text-xs text-gray-400 mt-1">hours logged</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Contributions
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {totalContributions}
          </p>
          <p className="text-xs text-gray-400 mt-1">entries total</p>
        </Card>
      </div>

      {/* Contribution breakdowns */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children">
        {/* Source breakdown */}
        <Card>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            By Source
          </p>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">GitHub</span>
                <span className="text-gray-500">{githubCount}</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{
                    width: `${totalContributions ? (githubCount / totalContributions) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">Manual</span>
                <span className="text-gray-500">{manualCount}</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${totalContributions ? (manualCount / totalContributions) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Verification status breakdown */}
        <Card>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Verification Status
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
              <p className="text-xs text-gray-500 mt-0.5">Pending</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-600">{verifiedCount}</p>
              <p className="text-xs text-gray-500 mt-0.5">Verified</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{flaggedCount}</p>
              <p className="text-xs text-gray-500 mt-0.5">Flagged</p>
            </div>
          </div>
        </Card>
      </section>

      {/* Category breakdown */}
      {categoryBreakdown.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Contributions by Category
          </h2>
          <Card>
            <div className="space-y-3">
              {categoryBreakdown.map((cat) => (
                <div key={cat.category}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{cat.category}</span>
                    <span className="text-gray-500">{cat.count}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-500 rounded-full"
                      style={{
                        width: `${totalContributions ? (cat.count / totalContributions) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}

      {/* Team members */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Team Members
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {members.map((m) => (
            <TeamMemberCard key={m.id} member={m} />
          ))}
        </div>
      </section>

      {/* Recent activity */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Recent Activity
        </h2>
        <ContributionList contributions={contributions} />
      </section>
    </div>
  );
}
