import { requireProject } from "@/lib/auth";
import pool from "@/lib/db";
import TeamMemberCard from "@/components/TeamMemberCard";
import InviteCodeCard from "@/components/InviteCodeCard";

export const metadata = {
  title: "Team — Contribution Tracker",
};

export default async function TeamPage() {
  const session = await requireProject();
  const projectId = session.user.projectId;

  // Fetch project info
  const { rows: projects } = await pool.query(
    "SELECT name, invite_code FROM projects WHERE id = $1",
    [projectId]
  );
  const project = projects[0];

  // Fetch team members with hours
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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team</h1>
        <p className="text-sm text-gray-500 mt-1">
          {project?.name} — {members.length} member
          {members.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Invite code */}
      <InviteCodeCard inviteCode={project?.invite_code} />

      {/* Team roster */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Members
        </h2>
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
      </section>
    </div>
  );
}
