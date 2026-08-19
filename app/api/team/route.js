import { auth } from "@/auth";
import pool from "@/lib/db";
import { NextResponse } from "next/server";

// GET /api/team — list all team members with their total hours
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.dbId || !session?.user?.projectId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rows } = await pool.query(
      `SELECT
         u.id,
         u.github_username,
         u.avatar_url,
         u.role,
         COALESCE(SUM(c.time_estimate), 0) AS total_hours,
         COUNT(c.id) AS contribution_count
       FROM users u
       LEFT JOIN contributions c ON c.user_id = u.id
       WHERE u.project_id = $1
       GROUP BY u.id
       ORDER BY u.role DESC, total_hours DESC`,
      [session.user.projectId]
    );

    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/team error:", err);
    return NextResponse.json(
      { error: "Failed to fetch team" },
      { status: 500 }
    );
  }
}
