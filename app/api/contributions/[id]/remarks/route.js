import { auth } from "@/auth";
import pool, { ensureSchema } from "@/lib/db";
import { NextResponse } from "next/server";

// GET /api/contributions/[id]/remarks — list faculty remarks on a
// contribution. Readable by the contribution's own student (so they can
// see feedback) and by any faculty supervising that project; scoped by
// project match either way, never by contribution ownership alone.
export async function GET(request, context) {
  try {
    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureSchema();

    const { id } = await context.params;
    const contributionId = parseInt(id, 10);
    if (isNaN(contributionId)) {
      return NextResponse.json({ error: "Invalid contribution ID" }, { status: 400 });
    }

    const { rows: contribRows } = await pool.query(
      "SELECT id, project_id FROM contributions WHERE id = $1",
      [contributionId]
    );
    const contribution = contribRows[0];
    if (!contribution) {
      return NextResponse.json({ error: "Contribution not found" }, { status: 404 });
    }

    const authorized = await canAccessProject(session, contribution.project_id);
    if (!authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { rows } = await pool.query(
      `SELECT r.id, r.remark, r.created_at, COALESCE(u.display_name, u.github_username) AS faculty_name,
              COALESCE(u.custom_avatar_url, u.avatar_url) AS avatar_url
       FROM contribution_remarks r
       JOIN users u ON u.id = r.faculty_user_id
       WHERE r.contribution_id = $1
       ORDER BY r.created_at DESC`,
      [contributionId]
    );

    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/contributions/[id]/remarks error:", err);
    return NextResponse.json({ error: "Failed to fetch remarks" }, { status: 500 });
  }
}

// POST /api/contributions/[id]/remarks — a faculty account leaves a
// remark on a contribution. Separate from contribution_votes: this never
// touches the approve/flag majority or the contribution score.
export async function POST(request, context) {
  try {
    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.userType !== "faculty") {
      return NextResponse.json(
        { error: "Forbidden: Only faculty accounts can leave remarks." },
        { status: 403 }
      );
    }

    await ensureSchema();

    const { id } = await context.params;
    const contributionId = parseInt(id, 10);
    if (isNaN(contributionId)) {
      return NextResponse.json({ error: "Invalid contribution ID" }, { status: 400 });
    }

    const { remark } = await request.json();
    if (!remark || !remark.trim()) {
      return NextResponse.json({ error: "Remark text is required." }, { status: 400 });
    }

    const { rows: contribRows } = await pool.query(
      "SELECT id, project_id FROM contributions WHERE id = $1",
      [contributionId]
    );
    const contribution = contribRows[0];
    if (!contribution) {
      return NextResponse.json({ error: "Contribution not found" }, { status: 404 });
    }

    const { rows: facultyRows } = await pool.query(
      "SELECT id FROM project_faculty WHERE project_id = $1 AND user_id = $2",
      [contribution.project_id, session.user.dbId]
    );
    if (facultyRows.length === 0) {
      return NextResponse.json(
        { error: "Forbidden: You do not supervise this project." },
        { status: 403 }
      );
    }

    const { rows } = await pool.query(
      `INSERT INTO contribution_remarks (contribution_id, faculty_user_id, project_id, remark)
       VALUES ($1, $2, $3, $4)
       RETURNING id, remark, created_at`,
      [contributionId, session.user.dbId, contribution.project_id, remark.trim()]
    );

    return NextResponse.json(
      {
        ...rows[0],
        faculty_name: session.user.githubUsername,
        avatar_url: session.user.avatarUrl,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/contributions/[id]/remarks error:", err);
    return NextResponse.json({ error: "Failed to create remark" }, { status: 500 });
  }
}

async function canAccessProject(session, projectId) {
  if (session.user.userType === "faculty") {
    const { rows } = await pool.query(
      "SELECT id FROM project_faculty WHERE project_id = $1 AND user_id = $2",
      [projectId, session.user.dbId]
    );
    return rows.length > 0;
  }
  const { rows } = await pool.query(
    "SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2",
    [projectId, session.user.dbId]
  );
  return rows.length > 0;
}
