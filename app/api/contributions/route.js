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
         COALESCE(COUNT(DISTINCT v.id) FILTER (WHERE v.vote = 'approve'), 0)::int AS approves_count,
         COALESCE(COUNT(DISTINCT v.id) FILTER (WHERE v.vote = 'flag'), 0)::int AS flags_count,
         MAX(CASE WHEN v.user_id = $2 THEN v.vote ELSE NULL END) AS my_vote,
         COUNT(DISTINCT a.id)::int AS attachment_count
       FROM contributions c
       JOIN users u ON u.id = c.user_id
       LEFT JOIN contribution_votes v ON v.contribution_id = c.id
       LEFT JOIN contribution_attachments a ON a.contribution_id = c.id
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
      attachments,
    } = body;

    if (!category || !description || time_estimate == null) {
      return NextResponse.json(
        { error: "category, description, and time_estimate are required." },
        { status: 400 }
      );
    }

    // Accept either the new multi-file `attachments` array or the legacy
    // single attachment_* fields (kept for any older caller) — either
    // way, the first file's metadata also lands in the legacy columns so
    // components that only read those still show something.
    const fileList = Array.isArray(attachments) && attachments.length > 0
      ? attachments
      : attachment_url
      ? [{ url: attachment_url, name: attachment_name, size: attachment_size, type: attachment_type }]
      : [];
    const first = fileList[0];

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { rows } = await client.query(
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
          first?.url || null,
          first?.name || null,
          first?.size || null,
          first?.type || null,
        ]
      );
      const contribution = rows[0];

      if (fileList.length > 0) {
        const cols = 5;
        const values = [];
        const placeholders = fileList.map((f, i) => {
          values.push(contribution.id, f.url, f.name || null, f.size || null, f.type || null);
          const base = i * cols;
          return `(${Array.from({ length: cols }, (_, j) => `$${base + j + 1}`).join(", ")})`;
        });
        await client.query(
          `INSERT INTO contribution_attachments (contribution_id, url, name, size, type)
           VALUES ${placeholders.join(", ")}`,
          values
        );
      }

      await client.query("COMMIT");
      return NextResponse.json({ ...contribution, attachments: fileList }, { status: 201 });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("POST /api/contributions error:", err);
    return NextResponse.json(
      { error: "Failed to create contribution" },
      { status: 500 }
    );
  }
}

