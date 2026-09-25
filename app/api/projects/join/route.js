import { auth } from "@/auth";
import pool from "@/lib/db";
import { isFaculty } from "@/lib/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// POST /api/projects/join — join a project via invite code
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (isFaculty(session)) {
      return NextResponse.json(
        { error: "Forbidden: Faculty accounts join projects via a faculty invite code instead." },
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

    // Check if user is already a member of this project
    const { rows: existingMember } = await pool.query(
      "SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2",
      [projectId, session.user.dbId]
    );

    if (existingMember.length > 0) {
      return NextResponse.json(
        { error: "You are already a member of this project." },
        { status: 409 }
      );
    }

    // Attach user to the project as member
    await pool.query(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1, $2, 'member')
       ON CONFLICT (project_id, user_id) DO NOTHING`,
      [projectId, session.user.dbId]
    );

    const cookieStore = await cookies();
    cookieStore.set("active_project_id", String(projectId), {
      path: "/",
      maxAge: 2592000,
      sameSite: "lax",
    });

    return NextResponse.json({ project_id: projectId }, { status: 200 });
  } catch (err) {
    console.error("POST /api/projects/join error:", err);
    return NextResponse.json(
      { error: "Failed to join project" },
      { status: 500 }
    );
  }
}
