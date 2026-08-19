/**
 * Edge-compatible Auth.js configuration.
 *
 * NOTE: Next.js middleware runs in the Edge Runtime, which cannot run Node-only
 * packages like 'pg' (PostgreSQL). We keep this config dependency-free so
 * middleware.js can use it for route protection without crashing.
 * Node-only callbacks (like database upserts) live in auth.js.
 */
export const authConfig = {
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      // Public routes
      const isPublicRoute =
        pathname === "/" ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon");

      if (isPublicRoute) return true;

      // Protected routes require user to be logged in
      if (!isLoggedIn) return false;

      // Authenticated user with no project memberships: redirect to /onboarding for all app routes except /onboarding
      const hasProject = !!auth?.user?.hasProjects || !!auth?.user?.projectId;
      const isOnboarding = pathname === "/onboarding";
      const isApi = pathname.startsWith("/api");

      if (!hasProject && !isOnboarding && !isApi) {
        return Response.redirect(new URL("/onboarding", nextUrl));
      }

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.dbId = user.dbId;
        token.projectId = user.projectId;
        token.role = user.role;
        token.hasProjects = user.hasProjects;
        token.githubUsername = user.githubUsername;
        token.avatarUrl = user.avatarUrl;
      }

      if (trigger === "update" && session) {
        token.projectId = session.projectId ?? token.projectId;
        token.role = session.role ?? token.role;
        if (session.projectId) token.hasProjects = true;
      }

      return token;
    },
    async session({ session, token }) {
      session.user.dbId = token.dbId;
      session.user.projectId = token.projectId;
      session.user.role = token.role;
      session.user.hasProjects = token.hasProjects;
      session.user.githubUsername = token.githubUsername;
      session.user.avatarUrl = token.avatarUrl;
      return session;
    },
  },
  providers: [], // Configured with GitHub in auth.js (Node runtime)
};
