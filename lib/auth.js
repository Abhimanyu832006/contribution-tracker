import { cache } from "react";
import { auth } from "@/auth";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Get the current NextAuth session (returns null if not authenticated).
 * Works in Server Components, Route Handlers, and Server Actions.
 *
 * Wrapped in React `cache()` so that layout.js and every page.js calling
 * requireAuth()/requireProject() within the same request share one
 * underlying auth() + DB round trip instead of repeating it per component.
 */
export const getSession = cache(async function getSession() {
  const session = await auth();
  return session;
});

/**
 * Require authentication — redirects to "/" if no session.
 * Returns the session if authenticated.
 */
export const requireAuth = cache(async function requireAuth() {
  const session = await getSession();
  if (!session?.user?.dbId) {
    redirect("/");
  }
  return session;
});

/**
 * Look up the active project membership for a user.
 * 1. Checks the `active_project_id` cookie to see if the user selected a specific project.
 * 2. If no cookie is present or invalid, falls back to the user's most-recently-joined project.
 * 3. Returns null if the user belongs to no projects.
 */
export const getActiveMembership = cache(async function getActiveMembership(userId) {
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
});

/**
 * Get all project memberships for a given user.
 */
export const getUserProjects = cache(async function getUserProjects(userId) {
  const { rows } = await pool.query(
    `SELECT p.id, p.name, p.invite_code, pm.role, pm.joined_at
     FROM project_members pm
     JOIN projects p ON p.id = pm.project_id
     WHERE pm.user_id = $1
     ORDER BY pm.joined_at DESC`,
    [userId]
  );
  return rows;
});

/**
 * Require authentication AND active project membership.
 * Redirects to "/onboarding" if the user has not joined any projects yet.
 * Populates session.user with active project details and all user projects.
 */
export async function requireProject() {
  const session = await requireAuth();
  const [membership, projects] = await Promise.all([
    getActiveMembership(session.user.dbId),
    getUserProjects(session.user.dbId),
  ]);

  if (!membership) {
    redirect("/onboarding");
  }

  // Attach active project context and membership list to session.user
  session.user.projectId = membership.project_id;
  session.user.role = membership.role;
  session.user.projectName = membership.name;
  session.user.inviteCode = membership.invite_code;
  session.user.projects = projects;

  return session;
}

// ── Faculty (Google-login, read-mostly) ─────────────────────────────
// Deliberately parallel to the student helpers above rather than reusing
// them: faculty supervise projects through project_faculty, never
// project_members, so they never appear in student rosters, hours totals,
// or the contribution-score report.

export function isFaculty(session) {
  return session?.user?.userType === "faculty";
}

export const getActiveFacultySupervision = cache(async function getActiveFacultySupervision(userId) {
  const cookieStore = await cookies();
  const cookieProjectId = cookieStore.get("active_faculty_project_id")?.value;

  if (cookieProjectId) {
    const { rows } = await pool.query(
      `SELECT pf.project_id, p.name, p.faculty_invite_code
       FROM project_faculty pf
       JOIN projects p ON p.id = pf.project_id
       WHERE pf.user_id = $1 AND pf.project_id = $2`,
      [userId, Number(cookieProjectId)]
    );
    if (rows.length > 0) return rows[0];
  }

  const { rows } = await pool.query(
    `SELECT pf.project_id, p.name, p.faculty_invite_code
     FROM project_faculty pf
     JOIN projects p ON p.id = pf.project_id
     WHERE pf.user_id = $1
     ORDER BY pf.joined_at DESC
     LIMIT 1`,
    [userId]
  );

  return rows[0] || null;
});

export const getFacultySupervisions = cache(async function getFacultySupervisions(userId) {
  const { rows } = await pool.query(
    `SELECT p.id, p.name, pf.joined_at
     FROM project_faculty pf
     JOIN projects p ON p.id = pf.project_id
     WHERE pf.user_id = $1
     ORDER BY pf.joined_at DESC`,
    [userId]
  );
  return rows;
});

export async function requireFaculty() {
  const session = await requireAuth();
  if (session.user.userType !== "faculty") {
    redirect("/dashboard");
  }

  const [supervision, projects] = await Promise.all([
    getActiveFacultySupervision(session.user.dbId),
    getFacultySupervisions(session.user.dbId),
  ]);

  session.user.projectId = supervision?.project_id || null;
  session.user.projectName = supervision?.name || null;
  session.user.projects = projects;

  return session;
}
