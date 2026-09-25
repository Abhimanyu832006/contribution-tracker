import Link from "next/link";
import { requireFaculty } from "@/lib/auth";
import pool from "@/lib/db";
import Card from "@/components/ui/Card";
import FacultyJoinForm from "@/components/FacultyJoinForm";

export const metadata = {
  title: "Faculty — Contribution Tracker",
};

export default async function FacultyHomePage() {
  const session = await requireFaculty();

  const { rows: projects } = await pool.query(
    `SELECT
       p.id,
       p.name,
       COUNT(DISTINCT pm.user_id)::int AS member_count,
       COUNT(DISTINCT c.id)::int AS contribution_count
     FROM project_faculty pf
     JOIN projects p ON p.id = pf.project_id
     LEFT JOIN project_members pm ON pm.project_id = p.id
     LEFT JOIN contributions c ON c.project_id = p.id
     WHERE pf.user_id = $1
     GROUP BY p.id, p.name
     ORDER BY p.name`,
    [session.user.dbId]
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-primary)]">
          Supervised Projects
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-xl">
          Review each team&apos;s contributions and reports, and leave remarks for students.
        </p>
      </div>

      {projects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger-children">
          {projects.map((p) => (
            <Link key={p.id} href={`/faculty/${p.id}`}>
              <Card hover accent="var(--color-team)" className="h-full">
                <p className="text-lg font-black text-[var(--color-text-primary)]">{p.name}</p>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                  {p.member_count} member{p.member_count === 1 ? "" : "s"} · {p.contribution_count}{" "}
                  contribution{p.contribution_count === 1 ? "" : "s"}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {projects.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-16 text-center gap-2">
          <p className="text-sm text-[var(--color-text-muted)] max-w-sm">
            You&apos;re not supervising any projects yet. Ask a project leader for their faculty
            invite code to get started.
          </p>
        </Card>
      )}

      <FacultyJoinForm />
    </div>
  );
}
