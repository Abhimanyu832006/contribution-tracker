import { auth } from "@/auth";
import pool, { ensureSchema } from "@/lib/db";
import { NextResponse } from "next/server";

const MAX_LENGTH = 40;

// PATCH /api/user/profile — update the signed-in user's own display name
// and/or profile photo. Both are deliberately separate columns
// (display_name, custom_avatar_url) rather than overwriting
// github_username/avatar_url directly: those two get overwritten with
// the real GitHub login and profile picture on every sign-in (and
// github_username is still used for commit-author matching in the
// GitHub sync), which would silently wipe out either customization the
// next time the user logs in.
export async function PATCH(request) {
  try {
    await ensureSchema();

    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { displayName, avatarUrl } = await request.json();
    const trimmed = typeof displayName === "string" ? displayName.trim() : "";

    if (trimmed.length > MAX_LENGTH) {
      return NextResponse.json(
        { error: `Display name must be ${MAX_LENGTH} characters or fewer.` },
        { status: 400 }
      );
    }

    const setClauses = ["display_name = $1"];
    const values = [trimmed || null];

    // Only touch the avatar column when a new upload was actually sent —
    // an absent avatarUrl means "no photo change", not "clear the photo".
    if (typeof avatarUrl === "string" && avatarUrl) {
      setClauses.push(`custom_avatar_url = $${values.length + 1}`);
      values.push(avatarUrl);
    }

    values.push(session.user.dbId);
    const { rows } = await pool.query(
      `UPDATE users SET ${setClauses.join(", ")} WHERE id = $${values.length}
       RETURNING id, display_name, github_username, avatar_url, custom_avatar_url`,
      values
    );

    const user = rows[0];
    return NextResponse.json({
      displayName: user.display_name,
      effectiveName: user.display_name || user.github_username,
      avatarUrl: user.custom_avatar_url || user.avatar_url,
    });
  } catch (err) {
    console.error("PATCH /api/user/profile error:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
