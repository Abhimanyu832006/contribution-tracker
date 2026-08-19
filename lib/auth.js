import { auth } from "@/auth";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Get the current NextAuth session (returns null if not authenticated).
 * Works in Server Components, Route Handlers, and Server Actions.
 */
export async function getSession() {
  const session = await auth();
  return session;
}

/**
 * Require authentication — redirects to "/" if no session.
 * Returns the session if authenticated.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.dbId) {
    redirect("/");
  }
  return session;
}

/**
 * Look up the active project membership for a user.
 * 1. Checks the `active_project_id` cookie to see if the user selected a specific project.
 * 2. If no cookie is present or invalid, falls back to the user's most-recently-joined project.
 * 3. Returns null if the user belongs to no projects.
 */
export async function getActiveMembership(userId) {
  const cookieStore = await cookies();
  const cookieProjectId = cookieStore.get("active_project_id")?.value;

  if (cookieProjectId) {
    const { rows } = await pool.query(
      `SELECT pm.project_id, pm.role, p.name, p.invite_code
       FROM project_members pm
       JOIN projects p ON p.id = pm.project_id
       WHERE pm.user_id = $1 AND pm.project_id = $2`,
      [userId, Number(cookieProjectId)]
    );
    if (rows.length > 0) return rows[0];
  }

  // Fall back to most-recently-joined project
  const { rows } = await pool.query(
    `SELECT pm.project_id, pm.role, p.name, p.invite_code
     FROM project_members pm
     JOIN projects p ON p.id = pm.project_id
     WHERE pm.user_id = $1
     ORDER BY pm.joined_at DESC
     LIMIT 1`,
    [userId]
  );

  return rows[0] || null;
}

/**
 * Get all project memberships for a given user.
 */
export async function getUserProjects(userId) {
  const { rows } = await pool.query(
    `SELECT p.id, p.name, p.invite_code, pm.role, pm.joined_at
     FROM project_members pm
     JOIN projects p ON p.id = pm.project_id
     WHERE pm.user_id = $1
     ORDER BY pm.joined_at DESC`,
    [userId]
  );
  return rows;
}

/**
 * Require authentication AND active project membership.
 * Redirects to "/onboarding" if the user has not joined any projects yet.
 * Populates session.user with active project details and all user projects.
 */
export async function requireProject() {
  const session = await requireAuth();
  const membership = await getActiveMembership(session.user.dbId);

  if (!membership) {
    redirect("/onboarding");
  }

  const projects = await getUserProjects(session.user.dbId);

  // Attach active project context and membership list to session.user
  session.user.projectId = membership.project_id;
  session.user.role = membership.role;
  session.user.projectName = membership.name;
  session.user.inviteCode = membership.invite_code;
  session.user.projects = projects;

  return session;
}
