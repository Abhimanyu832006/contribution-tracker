import Link from "next/link";
import { requireProject } from "@/lib/auth";
import pool from "@/lib/db";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import { CATEGORY_BADGE_MAP } from "@/lib/constants";

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
       COUNT(c.id)::int AS contribution_count
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
       COUNT(*) FILTER (WHERE status = 'flagged')::int AS flagged
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
  const maxCategoryCount = Math.max(...categoryBreakdown.map((c) => c.count), 1);
  const githubPct = counts.total ? Math.round((counts.github / counts.total) * 100) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{project?.name}</h1>
          {project?.repo_owner && project?.repo_name ? (
            <a
              href={`https://github.com/${project.repo_owner}/${project.repo_name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 mt-1 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              {project.repo_owner}/{project.repo_name}
            </a>
          ) : (
            <Link href="/settings" className="text-sm text-slate-400 hover:text-indigo-600 mt-1 inline-block transition-colors">
              No repository linked — connect one in Settings
            </Link>
          )}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 stagger-children">
        <Card>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Contributions</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{counts.total}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Hours logged</p>
          <p className="text-3xl font-bold text-indigo-600 mt-2">{totalHours.toFixed(1)}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Team</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{members.length}</p>
        </Card>
        <Link href="/peer-verification">
          <Card hover className="h-full">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">To review</p>
            <p className={`text-3xl font-bold mt-2 ${counts.pending > 0 ? "text-amber-600" : "text-green-600"}`}>
              {counts.pending}
            </p>
          </Card>
        </Link>
      </div>

      {/* GitHub / Manual split + Verification snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Source</p>
          {counts.total > 0 ? (
            <>
              <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
                <div className="bg-blue-500" style={{ width: `${githubPct}%` }} />
                <div className="bg-amber-500 flex-1" />
              </div>
              <div className="flex items-center justify-between mt-3 text-sm">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-blue-500" /> GitHub · {counts.github}
                </span>
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Manual · {counts.manual}
                </span>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400">No contributions yet</p>
          )}
        </Card>

        <Card>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Verification</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-amber-600">{counts.pending}</p>
              <p className="text-xs text-slate-500 mt-0.5">Pending</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{counts.verified}</p>
              <p className="text-xs text-slate-500 mt-0.5">Verified</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{counts.flagged}</p>
              <p className="text-xs text-slate-500 mt-0.5">Flagged</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Category breakdown */}
      {categoryBreakdown.length > 0 && (
        <Card>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">By category</p>
          <div className="space-y-3">
            {categoryBreakdown.map((cat) => (
              <div key={cat.category}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700">{cat.category}</span>
                  <span className="text-slate-500">{cat.count}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${(cat.count / maxCategoryCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Team members */}
      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Team</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {members.map((m) => (
            <Card key={m.id} hover className="flex items-center gap-3">
              <Avatar src={m.avatar_url} name={m.github_username} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-slate-900 truncate">{m.github_username}</p>
                  {m.role === "leader" && <Badge variant="indigo">Leader</Badge>}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{m.contribution_count} contributions</p>
              </div>
              <p className="text-lg font-bold text-slate-900 shrink-0">{m.total_hours.toFixed(1)}h</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Recent activity */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent Activity</h2>
          <Link href="/contributions" className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
            View all →
          </Link>
        </div>

        {entries.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-sm text-slate-400">No contributions logged yet.</p>
          </Card>
        ) : (
          <div className="space-y-2.5 stagger-children">
            {entries.map((e) => {
              const isGithub = e.source === "github";
              const href = isGithub && e.commit_url ? e.commit_url : `/contributions/${e.id}`;
              const linkProps = isGithub && e.commit_url ? { target: "_blank", rel: "noopener noreferrer" } : {};
              return (
                <Link key={e.id} href={href} {...linkProps} className="block">
                  <Card
                    hover
                    accent={isGithub ? "github" : "manual"}
                    padding="p-3.5"
                    className="flex items-center gap-3"
                  >
                    <Avatar src={e.avatar_url} name={e.github_username} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-900">{e.github_username}</span>
                        <Badge variant={isGithub ? "blue" : "yellow"}>{isGithub ? "GitHub" : "Manual"}</Badge>
                        <Badge variant={CATEGORY_BADGE_MAP[e.category] || "default"}>{e.category}</Badge>
                      </div>
                      <p className="text-sm text-slate-600 truncate mt-0.5">{e.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {!isGithub && e.time_estimate > 0 && (
                        <p className="text-sm font-semibold text-slate-900">{Number(e.time_estimate).toFixed(1)}h</p>
                      )}
                      <p className="text-xs text-slate-400 mt-0.5">{timeAgo(e.created_at)}</p>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
