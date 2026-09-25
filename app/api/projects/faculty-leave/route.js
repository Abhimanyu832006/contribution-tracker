import { auth } from "@/auth";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// DELETE /api/projects/faculty-leave — a faculty account stops
// supervising one of its projects. Mirrors /api/projects/members' self-
// leave path, but against project_faculty instead of project_members.
export async function DELETE(request) {
  try {
    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.userType !== "faculty") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { projectId } = await request.json();
    const targetProjectId = Number(projectId);
    if (!targetProjectId) {
      return NextResponse.json({ error: "Project ID is required." }, { status: 400 });
    }

    await pool.query(
      "DELETE FROM project_faculty WHERE project_id = $1 AND user_id = $2",
      [targetProjectId, session.user.dbId]
    );

    const { rows: remaining } = await pool.query(
      "SELECT project_id FROM project_faculty WHERE user_id = $1 ORDER BY joined_at DESC LIMIT 1",
      [session.user.dbId]
    );

    const cookieStore = await cookies();
    if (remaining.length > 0) {
      cookieStore.set("active_faculty_project_id", String(remaining[0].project_id), {
        path: "/",
        maxAge: 2592000,
        sameSite: "lax",
      });
    } else {
      cookieStore.delete("active_faculty_project_id");
    }

    return NextResponse.json({ success: true, remainingProjects: remaining.length });
  } catch (err) {
    console.error("DELETE /api/projects/faculty-leave error:", err);
    return NextResponse.json({ error: "Failed to stop supervising project" }, { status: 500 });
  }
}
