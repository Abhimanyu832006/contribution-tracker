import { requireProject } from "@/lib/auth";
import pool from "@/lib/db";
import ProjectSettingsCard from "@/components/ProjectSettingsCard";
import InviteCodeCard from "@/components/InviteCodeCard";
import TeamMemberCard from "@/components/TeamMemberCard";
import GitHubRepoForm from "@/components/GitHubRepoForm";

export const metadata = {
  title: "Project Settings — Contribution Tracker",
};

export default async function SettingsPage() {
  const session = await requireProject();
  const projectId = session.user.projectId;

  // Fetch project details
  const { rows: projects } = await pool.query(
    "SELECT id, name, invite_code, repo_owner, repo_name, created_at FROM projects WHERE id = $1",
    [projectId]
  );
  const project = projects[0];

  // Fetch team members with hours (same query as Team page)
  const { rows: members } = await pool.query(
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
  );

  const memberCount = members.length;

  return (
    <div className="space-y-10">
      {/* Page header */}
      <div className="rule-strong-b pb-5">
        <p className="label-mono mb-2">PROJECT SETTINGS</p>
        <h1 className="font-serif text-4xl sm:text-5xl leading-none">
          {project?.name}
        </h1>
      </div>

      {/* ── GitHub Integration ────────────────────────────────────── */}
      <GitHubRepoForm
        initialRepo={project?.repo_owner && project?.repo_name ? `${project.repo_owner}/${project.repo_name}` : ""}
        isLeader={session.user.role === "leader"}
      />

      {/* ── Team Management ─────────────────────────────────────────── */}
      <section className="space-y-4">
        <p className="label-mono rule-b pb-2">TEAM MANAGEMENT</p>

        {/* Invite code */}
        <InviteCodeCard inviteCode={project?.invite_code} />

        {/* Member roster */}
        <div>
          <p className="label-mono mb-3">MEMBERS ({memberCount})</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <p className="label-mono rule-b pb-2">PROJECT LIFECYCLE</p>

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
