/**
 * Node.js Runtime Auth.js initialization.
 *
 * This file handles full authentication logic (GitHub OAuth provider, PostgreSQL
 * user upsert on signIn, and session creation). It runs in the Node runtime where
 * database drivers like 'pg' are fully supported (unlike Edge middleware).
 */
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import pool from "@/lib/db";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      authorization: { params: { scope: "read:user" } },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // ── On every sign-in, upsert the user into Postgres ──────
    async signIn({ user, account, profile }) {
      if (account?.provider !== "github") return true;

      try {
        const { rows: userRows } = await pool.query(
          `INSERT INTO users (github_id, github_username, avatar_url, github_access_token)
           VALUES ($1, $2, $3, $4)
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
          `SELECT project_id, role FROM project_members WHERE user_id = $1 ORDER BY joined_at ASC LIMIT 1`,
          [dbId]
        );

        user.dbId = dbId;
        user.projectId = memberRows[0]?.project_id || null;
        user.role = memberRows[0]?.role || null;
        user.githubUsername = profile.login;
        user.avatarUrl = profile.avatar_url;
      } catch (err) {
        console.error("signIn upsert error:", err);
        return false;
      }

      return true;
    },
  },
  session: { strategy: "jwt" },
});
