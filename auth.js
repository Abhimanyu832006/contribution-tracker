/**
 * Node.js Runtime Auth.js initialization.
 *
 * This file handles full authentication logic (GitHub + Google OAuth
 * providers, PostgreSQL user upsert on signIn, and session creation). It
 * runs in the Node runtime where database drivers like 'pg' are fully
 * supported (unlike Edge middleware).
 *
 * Two providers, two roles: GitHub is the student login (unchanged from
 * before), Google is a login-only faculty provider — `openid email
 * profile` scopes, no Drive/Docs access. A user's role is derived
 * entirely from which provider they authenticated with, not a manual
 * selection screen.
 */
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import pool from "@/lib/db";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      authorization: { params: { scope: "read:user repo" } },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: { params: { scope: "openid email profile" } },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // ── On every sign-in, upsert the user into Postgres ──────
    async signIn({ user, account, profile }) {
      if (account?.provider === "github") {
        try {
          const { rows: userRows } = await pool.query(
            `INSERT INTO users (github_id, github_username, avatar_url, github_access_token, user_type)
             VALUES ($1, $2, $3, $4, 'student')
             ON CONFLICT (github_id) DO UPDATE
               SET github_username     = EXCLUDED.github_username,
                   avatar_url          = EXCLUDED.avatar_url,
                   github_access_token = EXCLUDED.github_access_token
             RETURNING id`,
            [
              String(profile.id),
              profile.login,
              profile.avatar_url,
              account.access_token,
            ]
          );

          const dbId = userRows[0].id;
          const { rows: memberRows } = await pool.query(
            `SELECT project_id, role FROM project_members WHERE user_id = $1 ORDER BY joined_at DESC LIMIT 1`,
            [dbId]
          );

          user.dbId = dbId;
          user.userType = "student";
          user.projectId = memberRows[0]?.project_id || null;
          user.role = memberRows[0]?.role || null;
          user.hasProjects = memberRows.length > 0;
          user.githubUsername = profile.login;
          user.avatarUrl = profile.avatar_url;
        } catch (err) {
          console.error("GitHub signIn upsert error:", err);
          return false;
        }
        return true;
      }

      if (account?.provider === "google") {
        try {
          // Faculty display name/avatar are stored in the same
          // github_username/avatar_url columns every existing UI
          // component (Avatar, TeamMemberCard, etc.) already reads —
          // deliberately reused as a generic "display identity" rather
          // than forking those components for a second column.
          const { rows: userRows } = await pool.query(
            `INSERT INTO users (google_id, github_username, avatar_url, user_type)
             VALUES ($1, $2, $3, 'faculty')
             ON CONFLICT (google_id) DO UPDATE
               SET github_username = EXCLUDED.github_username,
                   avatar_url      = EXCLUDED.avatar_url
             RETURNING id`,
            [String(profile.sub), profile.name, profile.picture]
          );

          const dbId = userRows[0].id;
          const { rows: facultyRows } = await pool.query(
            `SELECT project_id FROM project_faculty WHERE user_id = $1 ORDER BY joined_at DESC LIMIT 1`,
            [dbId]
          );

          user.dbId = dbId;
          user.userType = "faculty";
          user.projectId = facultyRows[0]?.project_id || null;
          user.role = "faculty";
          user.hasProjects = facultyRows.length > 0;
          user.githubUsername = profile.name;
          user.avatarUrl = profile.picture;
        } catch (err) {
          console.error("Google signIn upsert error:", err);
          return false;
        }
        return true;
      }

      return true;
    },
  },
  session: { strategy: "jwt" },
});
