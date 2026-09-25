import { requireProject } from "@/lib/auth";
import pool, { ensureSchema } from "@/lib/db";
import ProjectSettingsCard from "@/components/ProjectSettingsCard";
import InviteCodeCard from "@/components/InviteCodeCard";
import TeamMemberCard from "@/components/TeamMemberCard";
import GitHubRepoForm from "@/components/GitHubRepoForm";
import GoogleDocsForm from "@/components/GoogleDocsForm";

export const metadata = {
  title: "Project Settings — Contribution Tracker",
};

export default async function SettingsPage() {
  const session = await requireProject();
  const projectId = session.user.projectId;
  await ensureSchema();

  // Fetch project details + team members with hours in parallel — independent queries
  const [{ rows: projects }, { rows: members }, { rows: leaderRows }] = await Promise.all([
    pool.query(
      `SELECT id, name, invite_code, repo_owner, repo_name, google_folder_id, leader_id, created_at
       FROM projects WHERE id = $1`,
      [projectId]
    ),
    pool.query(
      `SELECT
         u.id,
         u.github_username,
         u.avatar_url,
         pm.role,
         COALESCE(SUM(c.time_estimate), 0) AS total_hours
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       LEFT JOIN contributions c ON c.user_id = u.id AND c.project_id = pm.project_id
       WHERE pm.project_id = $1
       GROUP BY u.id, pm.role
       ORDER BY pm.role DESC, total_hours DESC`,
      [projectId]
    ),
    pool.query(
      `SELECT u.google_refresh_token
       FROM projects p JOIN users u ON u.id = p.leader_id
       WHERE p.id = $1`,
      [projectId]
    ),
  ]);
  const project = projects[0];
  const memberCount = members.length;
  const googleConnected = !!leaderRows[0]?.google_refresh_token;

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-primary)]">Project Settings</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Manage workspace details, team membership, and integrations for{" "}
          {project?.name}
        </p>
      </div>

      {/* ── GitHub Integration ────────────────────────────────────── */}
      <GitHubRepoForm
        initialRepo={project?.repo_owner && project?.repo_name ? `${project.repo_owner}/${project.repo_name}` : ""}
        isLeader={session.user.role === "leader"}
      />

      {/* ── Google Docs Integration ──────────────────────────────────── */}
      <GoogleDocsForm
        initialFolderId={project?.google_folder_id || ""}
        isLeader={session.user.role === "leader"}
        googleConnected={googleConnected}
      />

      {/* ── Team Management ─────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="label-mono">
          Team Management
        </h2>

        {/* Invite code */}
        <InviteCodeCard inviteCode={project?.invite_code} />

        {/* Member roster */}
        <div>
          <h3 className="label-mono mb-3">
            Members ({memberCount})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children">
            {members.map((m) => (
              <TeamMemberCard
                key={m.id}
                member={m}
                isLeader={session.user.role === "leader"}
                currentUserId={session.user.dbId}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Project lifecycle (leave / delete) ──────────────────────── */}
      <section className="space-y-4">
        <h2 className="label-mono">
          Project Lifecycle
        </h2>

        {project && (
          <ProjectSettingsCard
            project={project}
            role={session.user.role}
            memberCount={memberCount}
          />
        )}
      </section>
    </div>
  );
}
