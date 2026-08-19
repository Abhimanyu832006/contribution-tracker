import { auth } from "@/auth";
import pool from "@/lib/db";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "crypto";

// POST /api/projects — create a new project
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Project name is required." },
        { status: 400 }
      );
    }

    // Generate a short random invite code (8 chars, uppercase alphanumeric)
    const inviteCode = crypto
      .randomBytes(6)
      .toString("base64url")
      .slice(0, 8)
      .toUpperCase();

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Create the project
      const { rows: projectRows } = await client.query(
        `INSERT INTO projects (name, invite_code, leader_id)
         VALUES ($1, $2, $3)
         RETURNING id, invite_code`,
        [name.trim(), inviteCode, session.user.dbId]
      );
      const project = projectRows[0];

      // Attach the user to the project as leader
      await client.query(
        `INSERT INTO project_members (project_id, user_id, role)
         VALUES ($1, $2, 'leader')
         ON CONFLICT (project_id, user_id) DO UPDATE SET role = 'leader'`,
        [project.id, session.user.dbId]
      );

      await client.query("COMMIT");

      const cookieStore = await cookies();
      cookieStore.set("active_project_id", String(project.id), {
        path: "/",
        maxAge: 2592000,
        sameSite: "lax",
      });

      return NextResponse.json(
        {
          project_id: project.id,
          invite_code: project.invite_code,
        },
        { status: 201 }
      );
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("POST /api/projects error:", err);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
