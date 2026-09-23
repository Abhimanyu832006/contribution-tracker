import { requireAuth, getActiveMembership, getUserProjects } from "@/lib/auth";
import AppChrome from "@/components/AppChrome";

export default async function AppLayout({ children }) {
  const session = await requireAuth();
  const membership = await getActiveMembership(session.user.dbId);

  // If user has no active project membership (e.g. on /onboarding), render children directly without chrome
  if (!membership) {
    return <>{children}</>;
  }

  const projects = await getUserProjects(session.user.dbId);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
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
