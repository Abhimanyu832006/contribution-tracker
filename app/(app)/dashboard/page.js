import { requireProject } from "@/lib/auth";
import pool from "@/lib/db";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
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
       u.role,
       COALESCE(SUM(c.time_estimate), 0) AS total_hours,
       COUNT(c.id) AS contribution_count
     FROM users u
     LEFT JOIN contributions c ON c.user_id = u.id
     WHERE u.project_id = $1
     GROUP BY u.id
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
       c.created_at,
       u.github_username,
       u.avatar_url
     FROM contributions c
     JOIN users u ON u.id = c.user_id
     WHERE u.project_id = $1
     ORDER BY c.created_at DESC
     LIMIT 10`,
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

      {/* Team members */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Team Members
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {members.map((m) => (
            <Card key={m.id} hover>
              <div className="flex items-center gap-3">
                <Avatar
                  src={m.avatar_url}
                  name={m.github_username}
                  size="lg"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {m.github_username}
                    </p>
                    <Badge
                      variant={m.role === "leader" ? "indigo" : "default"}
                    >
                      {m.role === "leader" ? "Leader" : "Member"}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {Number(m.contribution_count)} contribution
                    {Number(m.contribution_count) !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xl font-bold text-indigo-600">
                    {Number(m.total_hours).toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-400">hrs</p>
                </div>
              </div>
            </Card>
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
