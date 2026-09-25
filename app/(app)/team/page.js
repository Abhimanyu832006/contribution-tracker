import { requireProject } from "@/lib/auth";
import pool, { ensureSchema } from "@/lib/db";
import InviteCodeCard from "@/components/InviteCodeCard";
import TeamMemberCard from "@/components/TeamMemberCard";

export const metadata = {
  title: "Team — Contribution Tracker",
};

export default async function TeamPage() {
  const session = await requireProject();
  const projectId = session.user.projectId;
  await ensureSchema();

  const [{ rows: projects }, { rows: members }] = await Promise.all([
    pool.query(
      `SELECT id, name, invite_code FROM projects WHERE id = $1`,
      [projectId]
    ),
    pool.query(
      `SELECT
         u.id,
         COALESCE(u.display_name, u.github_username) AS github_username,
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
  ]);
  const project = projects[0];
  const memberCount = members.length;
  const isLeader = session.user.role === "leader";

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-primary)]">Team</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Invite teammates and see who&apos;s on {project?.name}
        </p>
      </div>

      {/* Invite code */}
      <InviteCodeCard inviteCode={project?.invite_code} />

      {/* Member roster */}
      <div>
        <h2 className="label-mono mb-3">
          Members ({memberCount})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children">
          {members.map((m) => (
            <TeamMemberCard
              key={m.id}
              member={m}
              isLeader={isLeader}
              currentUserId={session.user.dbId}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
