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
        const { rows } = await pool.query(
          `INSERT INTO users (github_id, github_username, avatar_url, github_access_token)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (github_id) DO UPDATE
             SET github_username     = EXCLUDED.github_username,
                 avatar_url          = EXCLUDED.avatar_url,
                 github_access_token = EXCLUDED.github_access_token
           RETURNING id, project_id, role`,
          [
            String(profile.id),
            profile.login,
            profile.avatar_url,
            account.access_token,
          ]
        );

        user.dbId = rows[0].id;
        user.projectId = rows[0].project_id;
        user.role = rows[0].role;
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
