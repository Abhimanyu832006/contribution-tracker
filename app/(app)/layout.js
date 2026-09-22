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
    <div className="flex min-h-screen bg-[#f2ede3]">
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

      {/* Main content area — offset by sidebar width on large screens, top bar height on mobile */}
      <main className="flex-1 lg:ml-72 pt-14 lg:pt-0">
        {/* Editorial top strip — technical metadata, not decorative */}
        <div className="hidden lg:flex items-center justify-between px-8 py-2 border-b border-[rgba(28,26,21,0.14)] label-mono">
          <span>{membership.name.toUpperCase()}</span>
          <span>{membership.role === "leader" ? "ROLE: LEADER" : "ROLE: MEMBER"}</span>
        </div>
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
