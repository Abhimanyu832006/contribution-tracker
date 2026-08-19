import { auth } from "@/auth";
import pool from "@/lib/db";
import { getActiveMembership } from "@/lib/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// DELETE /api/projects/members — remove a member or leave project
export async function DELETE(request) {
  try {
    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const membership = await getActiveMembership(session.user.dbId);
    if (!membership) {
      return NextResponse.json(
        { error: "No active project found." },
        { status: 404 }
      );
    }

    const { userId } = await request.json();
    const targetUserId = Number(userId || session.user.dbId);
    const isSelf = targetUserId === session.user.dbId;

    if (isSelf) {
      // User is attempting to leave the project
      if (membership.role === "leader") {
        // Check if there are other members in the project
        const { rows: otherMembers } = await pool.query(
          "SELECT id FROM project_members WHERE project_id = $1 AND user_id != $2",
          [membership.project_id, session.user.dbId]
        );

        if (otherMembers.length > 0) {
          return NextResponse.json(
            {
              error:
                "As the team leader, you cannot leave while other members are in the project. Please delete the project from Settings or remove members first.",
            },
            { status: 400 }
          );
        }
      }

      // Remove self from project
      await pool.query(
        "DELETE FROM project_members WHERE project_id = $1 AND user_id = $2",
        [membership.project_id, session.user.dbId]
      );

      // Check if user has other projects to switch active cookie to
      const { rows: remaining } = await pool.query(
        "SELECT project_id FROM project_members WHERE user_id = $1 ORDER BY joined_at DESC LIMIT 1",
        [session.user.dbId]
      );

      const cookieStore = await cookies();
      if (remaining.length > 0) {
        cookieStore.set("active_project_id", String(remaining[0].project_id), {
          path: "/",
          maxAge: 2592000,
          sameSite: "lax",
        });
      } else {
        cookieStore.delete("active_project_id");
      }

      return NextResponse.json({ success: true, remainingProjects: remaining.length });
    } else {
      // Leader is removing another member
      if (membership.role !== "leader") {
        return NextResponse.json(
          { error: "Only team leaders can remove other members." },
          { status: 403 }
        );
      }

      await pool.query(
        "DELETE FROM project_members WHERE project_id = $1 AND user_id = $2",
        [membership.project_id, targetUserId]
      );

      return NextResponse.json({ success: true });
    }
  } catch (err) {
    console.error("DELETE /api/projects/members error:", err);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
