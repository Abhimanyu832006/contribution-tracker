import { notFound } from "next/navigation";
import { requireFaculty } from "@/lib/auth";
import pool from "@/lib/db";
import Card from "@/components/ui/Card";
import ScoresReport from "@/components/ScoresReport";
import FacultyContributionList from "@/components/FacultyContributionList";
import { computeContributionScore } from "@/lib/scoring";

export const metadata = {
  title: "Project Review — Contribution Tracker",
};

export default async function FacultyProjectPage({ params }) {
  const { projectId: rawId } = await params;
  const projectId = parseInt(rawId, 10);
  if (isNaN(projectId)) notFound();

  const session = await requireFaculty();

  // Confirm this faculty account actually supervises this project — the
  // project switcher only ever links to projects it already fetched for
  // this user, but a direct URL visit needs the same check API routes do.
  const { rows: supervisionRows } = await pool.query(
    "SELECT 1 FROM project_faculty WHERE project_id = $1 AND user_id = $2",
    [projectId, session.user.dbId]
  );
  if (supervisionRows.length === 0) notFound();

  const [{ rows: projectRows }, { rows: members }, { rows: scoringRows }, { rows: contributions }] = await Promise.all([
    pool.query("SELECT id, name FROM projects WHERE id = $1", [projectId]),
    pool.query(
      `SELECT
         u.id,
         COALESCE(u.display_name, u.github_username) AS github_username,
         u.avatar_url,
         pm.role,
         COALESCE(SUM(c.time_estimate), 0)::float AS total_hours,
         COUNT(c.id)::int AS contribution_count,
         COUNT(c.id) FILTER (WHERE c.source = 'github')::int AS github_count,
         COUNT(c.id) FILTER (WHERE c.source = 'manual')::int AS manual_count,
         COUNT(c.id) FILTER (WHERE c.source = 'google_docs')::int AS docs_count,
         COALESCE(SUM(c.word_count) FILTER (WHERE c.source = 'google_docs'), 0)::int AS docs_word_count,
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
    ),
    // Scored per-contribution (each one's own status determines its own
    // verification multiplier), then summed per member below.
    pool.query(
      `SELECT user_id, source, time_estimate, word_count, status
       FROM contributions WHERE project_id = $1`,
      [projectId]
    ),
    pool.query(
      `SELECT
         c.id, c.category, c.description, c.time_estimate, c.status, c.source, c.created_at,
         COALESCE(u.display_name, u.github_username) AS github_username, u.avatar_url,
         COALESCE(
           json_agg(
             jsonb_build_object(
               'id', r.id,
               'remark', r.remark,
               'created_at', r.created_at,
               'faculty_name', COALESCE(fu.display_name, fu.github_username),
               'avatar_url', fu.avatar_url
             ) ORDER BY r.created_at DESC
           ) FILTER (WHERE r.id IS NOT NULL),
           '[]'
         ) AS remarks
       FROM contributions c
       JOIN users u ON u.id = c.user_id
       LEFT JOIN contribution_remarks r ON r.contribution_id = c.id
       LEFT JOIN users fu ON fu.id = r.faculty_user_id
       WHERE c.project_id = $1
       GROUP BY c.id, u.id, u.avatar_url
       ORDER BY c.created_at DESC`,
      [projectId]
    ),
  ]);

  const project = projectRows[0];
  if (!project) notFound();

  const scoreByUser = new Map();
  for (const c of scoringRows) {
    const contributionScore = computeContributionScore({
      hours: c.source === "manual" ? c.time_estimate : 0,
      githubCount: c.source === "github" ? 1 : 0,
      docsCount: c.source === "google_docs" ? 1 : 0,
      docsWordCount: c.source === "google_docs" ? c.word_count : 0,
      status: c.status,
    });
    scoreByUser.set(c.user_id, (scoreByUser.get(c.user_id) || 0) + contributionScore);
  }

  const membersWithScore = members.map((m) => ({
    ...m,
    score: Math.round((scoreByUser.get(m.id) || 0) * 10) / 10,
  }));
  const teamTotalHours = members.reduce((sum, m) => sum + Number(m.total_hours), 0);
  const teamTotalContributions = members.reduce((sum, m) => sum + m.contribution_count, 0);

  return (
    <div className="space-y-10 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-primary)]">
          {project.name}
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-xl">
          Read-only report — the same figures and formula students see, plus the ability to leave
          remarks on individual contributions.
        </p>
      </div>

      {members.length === 0 || teamTotalContributions === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">
            No contributions recorded for this project yet.
          </p>
        </Card>
      ) : (
        <ScoresReport
          members={membersWithScore}
          projectName={project.name}
          teamTotalHours={teamTotalHours}
          teamTotalContributions={teamTotalContributions}
        />
      )}

      <section className="space-y-4">
        <h2 className="label-mono">Contributions & Remarks</h2>
        <FacultyContributionList initialContributions={contributions} />
      </section>
    </div>
  );
}
