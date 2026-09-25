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

      const userType = auth.user.userType || "student";
      const hasProject = !!auth.user.hasProjects || !!auth.user.projectId;
      const isOnboarding = pathname === "/onboarding";
      const isFacultyRoute = pathname.startsWith("/faculty");

      // Faculty and students live in two completely separate route trees
      // (Google-login faculty never see the student dashboard/log/vote
      // pages, and vice versa) — this is the single central place that
      // enforces the split, on every navigation.
      if (userType === "faculty") {
        if (!isFacultyRoute) {
          return Response.redirect(new URL("/faculty", nextUrl));
        }
        return true;
      }

      // Student: keep existing behavior exactly, plus fence off /faculty.
      if (isFacultyRoute) {
        return Response.redirect(new URL(hasProject ? "/dashboard" : "/onboarding", nextUrl));
      }
      if (!hasProject && !isOnboarding) {
        return Response.redirect(new URL("/onboarding", nextUrl));
      }

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.dbId = user.dbId;
        token.userType = user.userType;
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
      session.user.userType = token.userType || "student";
      session.user.projectId = token.projectId;
      session.user.role = token.role;
      session.user.hasProjects = token.hasProjects;
      session.user.githubUsername = token.githubUsername;
      session.user.avatarUrl = token.avatarUrl;
      return session;
    },
  },
  providers: [], // Configured with GitHub + Google in auth.js (Node runtime)
};
