import Link from "next/link";
import { requireProject } from "@/lib/auth";
import pool from "@/lib/db";
import Avatar from "@/components/ui/Avatar";
import HomeHeader from "@/components/HomeHeader";

export const metadata = {
  title: "Home — Contribution Tracker",
};

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

  const { rows: topCategory } = await pool.query(
    `SELECT category, COUNT(*)::int AS count FROM contributions
     WHERE project_id = $1 GROUP BY category ORDER BY count DESC LIMIT 1`,
    [projectId]
  );

  const totalHours = members.reduce((sum, m) => sum + m.total_hours, 0);
  const topMember = members[0];

  const tiles = [
    {
      href: "/contributions",
      label: "Contributions",
      accent: "var(--color-contributions)",
      big: "col-span-2 row-span-2",
      stat: counts.total,
      statLabel: "logged total",
      sub: `${counts.github} via GitHub · ${counts.manual} manual`,
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      ),
    },
    {
      href: "/peer-verification",
      label: "Peer Verification",
      accent: "var(--color-verification)",
      big: "col-span-1 row-span-1",
      stat: counts.pending,
      statLabel: "awaiting review",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      ),
    },
    {
      href: "/scores",
      label: "Reports",
      accent: "var(--color-reports)",
      dark: false,
      big: "col-span-1 row-span-1",
      stat: totalHours.toFixed(1),
      statLabel: "hours logged",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      ),
    },
    {
      href: "/team",
      label: "Team",
      accent: "var(--color-team)",
      big: "col-span-1 row-span-1",
      stat: members.length,
      statLabel: "members",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      ),
    },
    {
      href: "/settings",
      label: "Settings",
      accent: "var(--color-settings)",
      big: "col-span-1 row-span-1",
      stat: null,
      statLabel: project?.repo_name ? `${project.repo_owner}/${project.repo_name}` : "No repo linked",
      icon: (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </>
      ),
    },
    {
      href: "/log",
      label: "Log Contribution",
      accent: "#111111",
      textLight: true,
      big: "col-span-1 row-span-1",
      stat: "+",
      statLabel: "quick action",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      ),
    },
  ];

  return (
    <div className="min-h-screen">
      <HomeHeader
        projectName={project?.name}
        repoOwner={project?.repo_owner}
        repoName={project?.repo_name}
        user={{
          githubUsername: session.user.githubUsername,
          avatarUrl: session.user.avatarUrl,
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-8 pb-16">
        {/* Verification snapshot strip */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6 animate-fade-in">
          <div className="brutal-card px-4 py-3 sm:px-5 sm:py-4">
            <p className="label-mono text-[var(--color-text-muted)]">Pending</p>
            <p className="stat-num text-2xl sm:text-3xl mt-1" style={{ color: "var(--color-warning)" }}>{counts.pending}</p>
          </div>
          <div className="brutal-card px-4 py-3 sm:px-5 sm:py-4">
            <p className="label-mono text-[var(--color-text-muted)]">Verified</p>
            <p className="stat-num text-2xl sm:text-3xl mt-1" style={{ color: "var(--color-success)" }}>{counts.verified}</p>
          </div>
          <div className="brutal-card px-4 py-3 sm:px-5 sm:py-4">
            <p className="label-mono text-[var(--color-text-muted)]">Flagged</p>
            <p className="stat-num text-2xl sm:text-3xl mt-1" style={{ color: "var(--color-danger)" }}>{counts.flagged}</p>
          </div>
        </div>

        {/* Bento grid of modules */}
        <div className="grid grid-cols-2 sm:grid-cols-3 auto-rows-[140px] sm:auto-rows-[160px] gap-3 sm:gap-4 stagger-children">
          {tiles.map((tile) => (
            <Link
              key={tile.href}
              href={tile.href}
              className={`brutal-tile relative overflow-hidden flex flex-col justify-between p-4 sm:p-5 ${tile.big}`}
              style={{ background: tile.accent }}
            >
              <div className="flex items-center justify-between">
                <svg
                  className={`w-6 h-6 sm:w-7 sm:h-7 ${tile.textLight ? "text-white" : "text-black"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                >
                  {tile.icon}
                </svg>
                <svg
                  className={`w-4 h-4 ${tile.textLight ? "text-white/60" : "text-black/40"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
              <div>
                {tile.stat !== null && (
                  <p
                    className={`stat-num text-3xl sm:text-4xl ${tile.textLight ? "text-white" : "text-black"}`}
                  >
                    {tile.stat}
                  </p>
                )}
                <p className={`text-sm font-black uppercase tracking-tight mt-0.5 ${tile.textLight ? "text-white" : "text-black"}`}>
                  {tile.label}
                </p>
                <p className={`text-xs mt-0.5 truncate ${tile.textLight ? "text-white/70" : "text-black/60"}`}>
                  {tile.sub || tile.statLabel}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Top contributor + category highlight */}
        {(topMember || topCategory[0]) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6 stagger-children">
            {topMember && (
              <div className="brutal-card p-4 sm:p-5 flex items-center gap-3">
                <Avatar src={topMember.avatar_url} name={topMember.github_username} size="lg" />
                <div className="min-w-0">
                  <p className="label-mono text-[var(--color-text-muted)]">Top contributor</p>
                  <p className="text-lg font-black truncate mt-0.5">{topMember.github_username}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {topMember.total_hours.toFixed(1)}h · {topMember.contribution_count} contributions
                  </p>
                </div>
              </div>
            )}
            {topCategory[0] && (
              <div className="brutal-card p-4 sm:p-5 flex items-center justify-between">
                <div>
                  <p className="label-mono text-[var(--color-text-muted)]">Most active category</p>
                  <p className="text-lg font-black mt-0.5">{topCategory[0].category}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">{topCategory[0].count} entries</p>
                </div>
                <div
                  className="w-14 h-14 shrink-0 border-2 border-[var(--color-border)] rounded flex items-center justify-center"
                  style={{ background: "var(--color-reports)" }}
                >
                  <span className="stat-num text-xl">{topCategory[0].count}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
