import { auth } from "@/auth";
import { redirect } from "next/navigation";

/**
 * Get the current session (returns null if not authenticated).
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
  if (!session?.user) {
    redirect("/");
  }
  return session;
}

/**
 * Require authentication AND a project — redirects to "/onboarding"
 * if the user hasn't joined a project yet.
 */
export async function requireProject() {
  const session = await requireAuth();
  if (!session.user.projectId) {
    redirect("/onboarding");
  }
  return session;
}
