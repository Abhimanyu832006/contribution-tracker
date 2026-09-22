import { auth } from "@/auth";
import pool, { ensureSchema } from "@/lib/db";
import { getActiveMembership } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request, context) {
  try {
    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureSchema();

    const membership = await getActiveMembership(session.user.dbId);
    if (!membership) {
      return NextResponse.json(
        { error: "Forbidden: You must belong to a project to vote." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const contributionId = parseInt(id, 10);
    if (isNaN(contributionId)) {
      return NextResponse.json({ error: "Invalid contribution ID" }, { status: 400 });
    }

    const body = await request.json();
    const { vote, comment } = body;

    if (!vote || !["approve", "flag"].includes(vote)) {
      return NextResponse.json(
        { error: "Vote must be either 'approve' or 'flag'" },
        { status: 400 }
      );
    }

    // 1. Verify contribution exists and belongs to the active project
    const { rows: contribRows } = await pool.query(
      `SELECT id, user_id, project_id, status FROM contributions WHERE id = $1`,
      [contributionId]
    );

    if (contribRows.length === 0) {
      return NextResponse.json({ error: "Contribution not found" }, { status: 404 });
    }

    const contribution = contribRows[0];
    if (contribution.project_id !== membership.project_id) {
      return NextResponse.json({ error: "Contribution belongs to another project" }, { status: 403 });
    }

    // 2. Prevent self-voting
    if (contribution.user_id === session.user.dbId) {
      return NextResponse.json(
        { error: "You cannot vote on your own contribution" },
        { status: 400 }
      );
    }

    // 3. Upsert vote
    await pool.query(
      `INSERT INTO contribution_votes (contribution_id, user_id, vote, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (contribution_id, user_id)
       DO UPDATE SET vote = EXCLUDED.vote, comment = EXCLUDED.comment, created_at = NOW()`,
      [contributionId, session.user.dbId, vote, comment || null]
    );

    // 4. Calculate total tallies
    const { rows: tallyRows } = await pool.query(
      `SELECT
         COALESCE(COUNT(id) FILTER (WHERE vote = 'approve'), 0)::int AS approves,
         COALESCE(COUNT(id) FILTER (WHERE vote = 'flag'), 0)::int AS flags
       FROM contribution_votes
       WHERE contribution_id = $1`,
      [contributionId]
    );

    const { approves, flags } = tallyRows[0];

    // Status logic:
    // If flagged by at least 1 teammate -> 'flagged'
    // If approved by 2 or more teammates (with 0 flags) -> 'verified'
    // Else -> 'pending'
    let newStatus = "pending";
    if (flags > 0) {
      newStatus = "flagged";
    } else if (approves >= 2) {
      newStatus = "verified";
    }

    await pool.query(
      `UPDATE contributions SET status = $1 WHERE id = $2`,
      [newStatus, contributionId]
    );

    // Fetch the full, updated verification history for this contribution
    const { rows: voteRows } = await pool.query(
      `SELECT v.vote, v.comment, v.created_at, u.github_username AS username, u.avatar_url
       FROM contribution_votes v
       JOIN users u ON u.id = v.user_id
       WHERE v.contribution_id = $1
       ORDER BY v.created_at DESC`,
      [contributionId]
    );

    return NextResponse.json({
      success: true,
      contributionId,
      status: newStatus,
      approves_count: approves,
      flags_count: flags,
      my_vote: vote,
      votes: voteRows,
    });
  } catch (err) {
    console.error("POST /api/contributions/[id]/vote error:", err);
    return NextResponse.json(
      { error: "Failed to record vote" },
      { status: 500 }
    );
  }
}
