import { requireAuth, getActiveMembership, getUserProjects } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

export default async function AppLayout({ children }) {
  const session = await requireAuth();
  const membership = await getActiveMembership(session.user.dbId);

  // If user has no active project membership (e.g. on /onboarding), render children directly without sidebar
  if (!membership) {
    return <>{children}</>;
  }

  const projects = await getUserProjects(session.user.dbId);

  return (
    <div className="flex min-h-screen bg-[#fafafa]">
      <Sidebar
        user={{
          githubUsername: session.user.githubUsername,
          avatarUrl: session.user.avatarUrl,
          role: membership.role,
        }}
        projectName={membership.name}
        activeProjectId={membership.project_id}
        projects={projects}
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
