import { requireProject } from "@/lib/auth";
import pool from "@/lib/db";
import Card from "@/components/ui/Card";
import ScoresReport from "@/components/ScoresReport";

export const metadata = {
  title: "Reports — Contribution Tracker",
};

export default async function ScoresPage() {
  const session = await requireProject();
  const projectId = session.user.projectId;

  // Per-member breakdown: hours, contribution counts by source and status.
  // All figures are computed directly from recorded contributions/votes —
  // no invented weighting or scoring formula.
  const { rows: members } = await pool.query(
    `SELECT
       u.id,
       u.github_username,
       u.avatar_url,
       pm.role,
       COALESCE(SUM(c.time_estimate), 0)::float AS total_hours,
       COUNT(c.id)::int AS contribution_count,
       COUNT(c.id) FILTER (WHERE c.source = 'github')::int AS github_count,
       COUNT(c.id) FILTER (WHERE c.source = 'manual')::int AS manual_count,
       COUNT(c.id) FILTER (WHERE c.status = 'pending')::int AS pending_count,
       COUNT(c.id) FILTER (WHERE c.status IN ('verified', 'approved'))::int AS verified_count,
       COUNT(c.id) FILTER (WHERE c.status = 'flagged')::int AS flagged_count
     FROM project_members pm
     JOIN users u ON u.id = pm.user_id
     LEFT JOIN contributions c ON c.user_id = u.id AND c.project_id = pm.project_id
     WHERE pm.project_id = $1
     GROUP BY u.id, pm.role
     ORDER BY total_hours DESC`,
    [projectId]
  );

  const { rows: projectRows } = await pool.query(
    "SELECT name FROM projects WHERE id = $1",
    [projectId]
  );
  const projectName = projectRows[0]?.name || "Project";

  const teamTotalHours = members.reduce((sum, m) => sum + Number(m.total_hours), 0);
  const teamTotalContributions = members.reduce((sum, m) => sum + m.contribution_count, 0);

  return (
    <div className="space-y-8">
      <div className="rule-strong-b pb-5">
        <p className="label-mono mb-2">REPORTS</p>
        <h1 className="font-serif text-4xl sm:text-5xl leading-none">{projectName}</h1>
        <p className="text-sm text-[#4a473f] mt-3 max-w-xl">
          Per-member breakdown computed directly from recorded contributions and peer
          verification — export as CSV to share or archive.
        </p>
      </div>

      {members.length === 0 || teamTotalContributions === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-[#8a8578]">
            No contributions recorded yet — reports will populate automatically once your
            team starts logging work.
          </p>
        </Card>
      ) : (
        <ScoresReport
          members={members}
          projectName={projectName}
          teamTotalHours={teamTotalHours}
          teamTotalContributions={teamTotalContributions}
        />
      )}
    </div>
  );
}
