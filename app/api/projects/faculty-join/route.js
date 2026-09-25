import { auth } from "@/auth";
import pool, { ensureSchema } from "@/lib/db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// POST /api/projects/faculty-join — a faculty account (Google login)
// redeems a project's faculty_invite_code to start supervising it.
// Deliberately a separate endpoint from /api/projects/join (the student
// invite-code flow), which always inserts into project_members — faculty
// must never end up there.
export async function POST(request) {
  try {
    await ensureSchema();

    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.userType !== "faculty") {
      return NextResponse.json(
        { error: "Forbidden: Only faculty accounts can redeem a faculty invite code." },
        { status: 403 }
      );
    }

    const { invite_code } = await request.json();
    if (!invite_code || !invite_code.trim()) {
      return NextResponse.json(
        { error: "Invite code is required." },
        { status: 400 }
      );
    }

    const { rows: projectRows } = await pool.query(
      "SELECT id, leader_id FROM projects WHERE faculty_invite_code = $1",
      [invite_code.trim().toUpperCase()]
    );

    if (projectRows.length === 0) {
      return NextResponse.json(
        { error: "Invalid faculty invite code. Please check and try again." },
        { status: 404 }
      );
    }

    const project = projectRows[0];

    const { rows: existing } = await pool.query(
      "SELECT id FROM project_faculty WHERE project_id = $1 AND user_id = $2",
      [project.id, session.user.dbId]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "You are already supervising this project." },
        { status: 409 }
      );
    }

    await pool.query(
      `INSERT INTO project_faculty (project_id, user_id, invited_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (project_id, user_id) DO NOTHING`,
      [project.id, session.user.dbId, project.leader_id]
    );

    const cookieStore = await cookies();
    cookieStore.set("active_faculty_project_id", String(project.id), {
      path: "/",
      maxAge: 2592000,
      sameSite: "lax",
    });

    return NextResponse.json({ project_id: project.id }, { status: 200 });
  } catch (err) {
    console.error("POST /api/projects/faculty-join error:", err);
    return NextResponse.json(
      { error: "Failed to join project as faculty" },
      { status: 500 }
    );
  }
}
