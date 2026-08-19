import { requireProject } from "@/lib/auth";
import pool from "@/lib/db";
import ProjectSettingsCard from "@/components/ProjectSettingsCard";

export const metadata = {
  title: "Settings — Contribution Tracker",
};

export default async function SettingsPage() {
  const session = await requireProject();
  const projectId = session.user.projectId;

  // Fetch project details
  const { rows: projects } = await pool.query(
    "SELECT id, name, invite_code, created_at FROM projects WHERE id = $1",
    [projectId]
  );
  const project = projects[0];

  // Fetch member count
  const { rows: memberCountRows } = await pool.query(
    "SELECT COUNT(*) AS count FROM project_members WHERE project_id = $1",
    [projectId]
  );
  const memberCount = Number(memberCountRows[0]?.count || 1);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage workspace details and lifecycle for {project?.name}
        </p>
      </div>

      {project && (
        <ProjectSettingsCard
          project={project}
          role={session.user.role}
          memberCount={memberCount}
        />
      )}
    </div>
  );
}

