import { auth } from "@/auth";
import pool from "@/lib/db";
import { NextResponse } from "next/server";

// POST /api/projects/join — join a project via invite code
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { invite_code } = await request.json();
    if (!invite_code || !invite_code.trim()) {
      return NextResponse.json(
        { error: "Invite code is required." },
        { status: 400 }
      );
    }

    // Look up the project
    const { rows: projectRows } = await pool.query(
      "SELECT id FROM projects WHERE invite_code = $1",
      [invite_code.trim().toUpperCase()]
    );

    if (projectRows.length === 0) {
      return NextResponse.json(
        { error: "Invalid invite code. Please check and try again." },
        { status: 404 }
      );
    }

    const projectId = projectRows[0].id;

    // Check if user already belongs to a project
    const { rows: userRows } = await pool.query(
      "SELECT project_id FROM users WHERE id = $1",
      [session.user.dbId]
    );

    if (userRows[0]?.project_id) {
      return NextResponse.json(
        { error: "You already belong to a project." },
        { status: 409 }
      );
    }

    // Attach user to the project as member
    await pool.query(
      `UPDATE users SET project_id = $1, role = 'member' WHERE id = $2`,
      [projectId, session.user.dbId]
    );

    return NextResponse.json({ project_id: projectId }, { status: 200 });
  } catch (err) {
    console.error("POST /api/projects/join error:", err);
    return NextResponse.json(
      { error: "Failed to join project" },
      { status: 500 }
    );
  }
}
