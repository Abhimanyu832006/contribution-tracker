import { auth } from "@/auth";
import pool from "@/lib/db";
import { NextResponse } from "next/server";

// GET /api/contributions — scoped to the logged-in user's project
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.projectId) {
      return NextResponse.json(
        { error: "Forbidden: You must belong to a project to view contributions." },
        { status: 403 }
      );
    }

    const { rows } = await pool.query(
      `SELECT
         c.id,
         u.github_username,
         u.avatar_url,
         c.category,
         c.description,
         c.time_estimate,
         c.status,
         c.source,
         c.created_at
       FROM contributions c
       JOIN users u ON u.id = c.user_id
       WHERE c.project_id = $1
       ORDER BY c.created_at DESC`,
      [session.user.projectId]
    );

    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/contributions error:", err);
    return NextResponse.json(
      { error: "Failed to fetch contributions" },
      { status: 500 }
    );
  }
}

// POST /api/contributions — project_id & user_id come from session, not request body
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Explicitly verify session.user.projectId exists before insert
    if (!session.user.projectId) {
      return NextResponse.json(
        { error: "Forbidden: You must belong to a project to log contributions." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { category, description, time_estimate } = body;

    if (!category || !description || time_estimate == null) {
      return NextResponse.json(
        { error: "category, description, and time_estimate are required." },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      `INSERT INTO contributions (project_id, user_id, category, description, time_estimate)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [session.user.projectId, session.user.dbId, category, description, time_estimate]
    );

    return NextResponse.json(rows[0], { status: 201 });
  } catch (err) {
    console.error("POST /api/contributions error:", err);
    return NextResponse.json(
      { error: "Failed to create contribution" },
      { status: 500 }
    );
  }
}
