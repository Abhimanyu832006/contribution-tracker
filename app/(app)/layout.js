import { requireAuth, getActiveMembership, getUserProjects } from "@/lib/auth";
import AppChrome from "@/components/AppChrome";

export default async function AppLayout({ children }) {
  const session = await requireAuth();
  const [membership, projects] = await Promise.all([
    getActiveMembership(session.user.dbId),
    getUserProjects(session.user.dbId),
  ]);

  // If user has no active project membership (e.g. on /onboarding), render children directly without chrome
  if (!membership) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen dot-bg">
      <AppChrome
        user={{
          githubUsername: session.user.githubUsername,
          avatarUrl: session.user.avatarUrl,
          role: membership.role,
        }}
        projectName={membership.name}
        activeProjectId={membership.project_id}
        projects={projects}
      >
        {children}
      </AppChrome>
    </div>
  );
}
