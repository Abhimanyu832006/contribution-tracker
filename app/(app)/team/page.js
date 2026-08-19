import { requireProject } from "@/lib/auth";
import pool from "@/lib/db";
import TeamMemberCard from "@/components/TeamMemberCard";
import InviteCodeCard from "./InviteCodeCard";

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
       u.role,
       COALESCE(SUM(c.time_estimate), 0) AS total_hours
     FROM users u
     LEFT JOIN contributions c ON c.user_id = u.id
     WHERE u.project_id = $1
     GROUP BY u.id
     ORDER BY u.role DESC, total_hours DESC`,
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
            <TeamMemberCard key={m.id} member={m} />
          ))}
        </div>
      </section>
    </div>
  );
}
