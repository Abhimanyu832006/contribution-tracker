import { auth } from "@/auth";
import pool, { ensureSchema } from "@/lib/db";
import { NextResponse } from "next/server";

const MAX_LENGTH = 40;

// PATCH /api/user/profile — update the signed-in user's own display name.
// Deliberately a separate `display_name` column, never overwriting
// github_username: that column is still the real GitHub login used for
// commit-author matching in the GitHub sync (sync-github/route.js).
export async function PATCH(request) {
  try {
    await ensureSchema();

    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { displayName } = await request.json();
    const trimmed = typeof displayName === "string" ? displayName.trim() : "";

    if (trimmed.length > MAX_LENGTH) {
      return NextResponse.json(
        { error: `Display name must be ${MAX_LENGTH} characters or fewer.` },
        { status: 400 }
      );
    }

    // Empty string clears the override, reverting to the GitHub/Google name.
    const { rows } = await pool.query(
      `UPDATE users SET display_name = $1 WHERE id = $2
       RETURNING id, display_name, github_username, avatar_url`,
      [trimmed || null, session.user.dbId]
    );

    const user = rows[0];
    return NextResponse.json({
      displayName: user.display_name,
      effectiveName: user.display_name || user.github_username,
      avatarUrl: user.avatar_url,
    });
  } catch (err) {
    console.error("PATCH /api/user/profile error:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
