import { auth } from "@/auth";
import pool, { ensureSchema } from "@/lib/db";
import { getActiveMembership, isFaculty } from "@/lib/auth";
import { NextResponse } from "next/server";

// GET /api/contributions — scoped to the active project.
// Add ?mine=1 to get only the current user's contributions (used by Contributions page "Mine" tab).
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureSchema();

    const membership = await getActiveMembership(session.user.dbId);
    if (!membership) {
      return NextResponse.json(
        { error: "Forbidden: You must belong to a project to view contributions." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const mineOnly = searchParams.get("mine") === "1";

    const { rows } = await pool.query(
      `SELECT
         c.id,
         u.id AS user_id,
         COALESCE(u.display_name, u.github_username) AS github_username,
         u.avatar_url,
         c.category,
         c.description,
         c.time_estimate,
         c.status,
         c.source,
         c.commit_url,
         c.doc_url,
         c.attachment_url,
         c.attachment_name,
         c.attachment_size,
         c.attachment_type,
         c.created_at,
         COALESCE(COUNT(v.id) FILTER (WHERE v.vote = 'approve'), 0)::int AS approves_count,
         COALESCE(COUNT(v.id) FILTER (WHERE v.vote = 'flag'), 0)::int AS flags_count,
         MAX(CASE WHEN v.user_id = $2 THEN v.vote ELSE NULL END) AS my_vote
       FROM contributions c
       JOIN users u ON u.id = c.user_id
       LEFT JOIN contribution_votes v ON v.contribution_id = c.id
       WHERE c.project_id = $1
         ${mineOnly ? "AND c.user_id = $2" : ""}
       GROUP BY c.id, u.id, u.github_username, u.avatar_url
       ORDER BY c.created_at DESC`,
      [membership.project_id, session.user.dbId]
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

// POST /api/contributions — project_id & user_id come from active membership, not request body
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (isFaculty(session)) {
      return NextResponse.json(
        { error: "Forbidden: Faculty accounts cannot log contributions." },
        { status: 403 }
      );
    }

    await ensureSchema();

    const membership = await getActiveMembership(session.user.dbId);
    if (!membership) {
      return NextResponse.json(
        { error: "Forbidden: You must belong to a project to log contributions." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      category,
      description,
      time_estimate,
      attachment_url,
      attachment_name,
      attachment_size,
      attachment_type,
    } = body;

    if (!category || !description || time_estimate == null) {
      return NextResponse.json(
        { error: "category, description, and time_estimate are required." },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      `INSERT INTO contributions (
         project_id, user_id, category, description, time_estimate,
         attachment_url, attachment_name, attachment_size, attachment_type
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        membership.project_id,
        session.user.dbId,
        category,
        description,
        time_estimate,
        attachment_url || null,
        attachment_name || null,
        attachment_size || null,
        attachment_type || null,
      ]
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

