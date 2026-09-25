import { auth } from "@/auth";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// POST /api/projects/faculty-active — switch which supervised project a
// faculty account is currently viewing. Mirrors /api/projects/active but
// checks project_faculty instead of project_members.
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.userType !== "faculty") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { projectId } = await request.json();
    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required." },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      `SELECT pf.project_id, p.name
       FROM project_faculty pf
       JOIN projects p ON p.id = pf.project_id
       WHERE pf.user_id = $1 AND pf.project_id = $2`,
      [session.user.dbId, Number(projectId)]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "You are not supervising this project." },
        { status: 403 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set("active_faculty_project_id", String(rows[0].project_id), {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });

    return NextResponse.json({ success: true, projectId: rows[0].project_id, name: rows[0].name });
  } catch (err) {
    console.error("POST /api/projects/faculty-active error:", err);
    return NextResponse.json(
      { error: "Failed to switch supervised project" },
      { status: 500 }
    );
  }
}
