import { requireAuth } from "@/lib/auth";
import pool from "@/lib/db";
import Sidebar from "@/components/Sidebar";

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
    <div className="flex min-h-screen bg-[#fafafa]">
      <Sidebar
        user={{
          githubUsername: session.user.githubUsername,
          avatarUrl: session.user.avatarUrl,
          role: session.user.role,
        }}
        projectName={projectName}
      />

      {/* Main content area — offset by sidebar width */}
      <main className="flex-1 ml-64">
        <div className="max-w-5xl mx-auto px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
