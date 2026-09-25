import { requireProject } from "@/lib/auth";
import pool, { ensureSchema } from "@/lib/db";
import Card from "@/components/ui/Card";
import ScoresReport from "@/components/ScoresReport";
import { computeContributionScore } from "@/lib/scoring";

export const metadata = {
  title: "Reports — Contribution Tracker",
};

export default async function ScoresPage() {
  const session = await requireProject();
  const projectId = session.user.projectId;
  await ensureSchema();

  // Per-member breakdown: hours, contribution counts by source and status.
  // Every raw figure below is computed directly from recorded
  // contributions/votes. The one derived figure — `score` — is an
  // explicit, disclosed formula (see lib/scoring.js), not a hidden
  // weighting; the raw counts it's built from are shown right next to it
  // so nothing is hidden behind a single number.
  const [{ rows: members }, { rows: projectRows }, { rows: contributions }] = await Promise.all([
    pool.query(
      `SELECT
         u.id,
         COALESCE(u.display_name, u.github_username) AS github_username,
         COALESCE(u.custom_avatar_url, u.avatar_url) AS avatar_url,
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
    pool.query("SELECT name FROM projects WHERE id = $1", [projectId]),
    // Scored per-contribution (each one's own status determines its own
    // verification multiplier), then summed per member below.
    pool.query(
      `SELECT user_id, source, time_estimate, word_count, status
       FROM contributions WHERE project_id = $1`,
      [projectId]
    ),
  ]);
  const projectName = projectRows[0]?.name || "Project";

  const scoreByUser = new Map();
  for (const c of contributions) {
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
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-primary)]">Reports</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-xl">
          Per-member breakdown for {projectName}, computed directly from recorded
          contributions and peer verification — export as CSV to share or archive.
        </p>
      </div>

      {members.length === 0 || teamTotalContributions === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">
            No contributions recorded yet — reports will populate automatically once your
            team starts logging work.
          </p>
        </Card>
      ) : (
        <ScoresReport
          members={membersWithScore}
          projectName={projectName}
          teamTotalHours={teamTotalHours}
          teamTotalContributions={teamTotalContributions}
        />
      )}
    </div>
  );
}
