import { requireProject } from "@/lib/auth";
import pool, { ensureSchema } from "@/lib/db";
import ProjectSettingsCard from "@/components/ProjectSettingsCard";
import GitHubRepoForm from "@/components/GitHubRepoForm";
import GoogleDocsForm from "@/components/GoogleDocsForm";
import FacultyInviteCodeCard from "@/components/FacultyInviteCodeCard";

export const metadata = {
  title: "Project Settings — Contribution Tracker",
};

export default async function SettingsPage() {
  const session = await requireProject();
  const projectId = session.user.projectId;
  await ensureSchema();

  const [{ rows: projects }, { rows: memberCountRows }, { rows: leaderRows }] = await Promise.all([
    pool.query(
      `SELECT id, name, invite_code, faculty_invite_code, repo_owner, repo_name, google_folder_id, leader_id, created_at
       FROM projects WHERE id = $1`,
      [projectId]
    ),
    pool.query(
      `SELECT COUNT(*)::int AS count FROM project_members WHERE project_id = $1`,
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
  const memberCount = memberCountRows[0]?.count || 0;
  const googleConnected = !!leaderRows[0]?.google_refresh_token;

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-primary)]">Project Settings</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Manage workspace details and integrations for {project?.name}
          </p>
        </div>
        <span className="label-mono border border-[var(--color-border)] rounded px-2.5 py-1.5 bg-[var(--color-surface)]">
          Account: Student
        </span>
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

      {/* ── Faculty Invite (leader only) ─────────────────────────────── */}
      {session.user.role === "leader" && (
        <section className="space-y-4">
          <h2 className="label-mono">
            Faculty Supervision
          </h2>
          <FacultyInviteCodeCard inviteCode={project?.faculty_invite_code} />
        </section>
      )}

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
