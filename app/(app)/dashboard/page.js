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
