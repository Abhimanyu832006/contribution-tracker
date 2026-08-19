import { requireAuth } from "@/lib/auth";
import pool from "@/lib/db";
import AppShell from "./AppShell";

export default async function AppLayout({ children }) {
  const session = await requireAuth();

  // If user has no project, render children directly without the app shell sidebar (e.g. for /onboarding)
  if (!session.user.projectId) {
    return <>{children}</>;
  }

  // Fetch project name if user has a project
  let projectName = null;
  const { rows } = await pool.query(
    "SELECT name FROM projects WHERE id = $1",
    [session.user.projectId]
  );
  if (rows.length > 0) projectName = rows[0].name;

  return (
    <AppShell
      user={{
        githubUsername: session.user.githubUsername,
        avatarUrl: session.user.avatarUrl,
        role: session.user.role,
      }}
      projectName={projectName}
    >
      {children}
    </AppShell>
  );
}
