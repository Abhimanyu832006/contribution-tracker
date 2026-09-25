import { requireFaculty } from "@/lib/auth";
import FacultyHeader from "@/components/FacultyHeader";

export default async function FacultyLayout({ children }) {
  const session = await requireFaculty();

  return (
    <div className="min-h-screen">
      <FacultyHeader
        user={{
          githubUsername: session.user.githubUsername,
          avatarUrl: session.user.avatarUrl,
        }}
        projectName={session.user.projectName}
        activeProjectId={session.user.projectId}
        projects={session.user.projects}
      />
      <main>
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-10">{children}</div>
      </main>
    </div>
  );
}
