import { auth } from "@/auth";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// POST /api/projects/active — switch active project
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await request.json();
    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required." },
        { status: 400 }
      );
    }

    // Verify user is a member of this project
    const { rows } = await pool.query(
      `SELECT pm.project_id, pm.role, p.name, p.invite_code
       FROM project_members pm
       JOIN projects p ON p.id = pm.project_id
       WHERE pm.user_id = $1 AND pm.project_id = $2`,
      [session.user.dbId, Number(projectId)]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "You are not a member of this project." },
        { status: 403 }
      );
    }

    const member = rows[0];
    const cookieStore = await cookies();
    cookieStore.set("active_project_id", String(member.project_id), {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
    });

    return NextResponse.json({
      success: true,
      projectId: member.project_id,
      role: member.role,
      name: member.name,
    });
  } catch (err) {
    console.error("POST /api/projects/active error:", err);
    return NextResponse.json(
      { error: "Failed to switch active project" },
      { status: 500 }
    );
  }
}
