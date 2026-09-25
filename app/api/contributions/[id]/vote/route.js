import { auth } from "@/auth";
import pool, { ensureSchema } from "@/lib/db";
import { getActiveMembership, isFaculty } from "@/lib/auth";
import { NextResponse } from "next/server";

// Shared by POST (cast/switch) and DELETE (retract) — recomputes the
// majority-of-eligible-voters status from whatever's currently in
// contribution_votes and persists + returns it, so both endpoints always
// leave the contribution in a consistent state.
async function recomputeStatus(contributionId, projectId, contributorId) {
  const [{ rows: tallyRows }, { rows: eligibleRows }] = await Promise.all([
    pool.query(
      `SELECT
         COALESCE(COUNT(id) FILTER (WHERE vote = 'approve'), 0)::int AS approves,
         COALESCE(COUNT(id) FILTER (WHERE vote = 'flag'), 0)::int AS flags
       FROM contribution_votes
       WHERE contribution_id = $1`,
      [contributionId]
    ),
    pool.query(
      `SELECT COUNT(*) FILTER (WHERE user_id != $2)::int AS eligible
       FROM project_members WHERE project_id = $1`,
      [projectId, contributorId]
    ),
  ]);

  const { approves, flags } = tallyRows[0];
  const eligibleVoters = eligibleRows[0].eligible;
  const majority = Math.floor(eligibleVoters / 2) + 1;
  const totalVotes = approves + flags;

  let newStatus;
  if (eligibleVoters === 0) {
    newStatus = "verified";
  } else if (approves >= majority) {
    newStatus = "verified";
  } else if (flags >= majority) {
    newStatus = "flagged";
  } else if (totalVotes >= eligibleVoters && totalVotes > 0) {
    newStatus = "contested";
  } else {
    newStatus = "pending";
  }

  await pool.query(`UPDATE contributions SET status = $1 WHERE id = $2`, [newStatus, contributionId]);

  return { approves, flags, eligibleVoters, majority, newStatus };
}

async function fetchVoteHistory(contributionId) {
  const { rows } = await pool.query(
    `SELECT v.vote, v.comment, v.created_at, COALESCE(u.display_name, u.github_username) AS username,
            COALESCE(u.custom_avatar_url, u.avatar_url) AS avatar_url
     FROM contribution_votes v
     JOIN users u ON u.id = v.user_id
     WHERE v.contribution_id = $1
     ORDER BY v.created_at DESC`,
    [contributionId]
  );
  return rows;
}

// POST /api/contributions/[id]/vote — cast a vote, or switch an existing
// one (approve -> flag or vice versa). To actually retract a vote
// (returning to no vote at all), see DELETE below.
export async function POST(request, context) {
  try {
    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (isFaculty(session)) {
      return NextResponse.json(
        { error: "Forbidden: Faculty accounts cannot vote on contributions." },
        { status: 403 }
      );
    }

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
      `SELECT id, user_id, project_id, status, source FROM contributions WHERE id = $1`,
      [contributionId]
    );

    if (contribRows.length === 0) {
      return NextResponse.json({ error: "Contribution not found" }, { status: 404 });
    }

    const contribution = contribRows[0];
    if (contribution.project_id !== membership.project_id) {
      return NextResponse.json({ error: "Contribution belongs to another project" }, { status: 403 });
    }

    // GitHub commits are auto-verified at sync time — peer voting on them
    // isn't meaningful (there's no self-reported claim to check).
    if (contribution.source === "github") {
      return NextResponse.json(
        { error: "GitHub commits are auto-verified and cannot be voted on." },
        { status: 400 }
      );
    }

    // 2. Prevent self-voting
    if (contribution.user_id === session.user.dbId) {
      return NextResponse.json(
        { error: "You cannot vote on your own contribution" },
        { status: 400 }
      );
    }

    // 3. Upsert vote — casts a new vote, or switches an existing one to
    // the other type (approve <-> flag), same request either way.
    await pool.query(
      `INSERT INTO contribution_votes (contribution_id, user_id, vote, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (contribution_id, user_id)
       DO UPDATE SET vote = EXCLUDED.vote, comment = EXCLUDED.comment, created_at = NOW()`,
      [contributionId, session.user.dbId, vote, comment || null]
    );

    const { approves, flags, eligibleVoters, majority, newStatus } = await recomputeStatus(
      contributionId,
      contribution.project_id,
      contribution.user_id
    );
    const voteRows = await fetchVoteHistory(contributionId);

    return NextResponse.json({
      success: true,
      contributionId,
      status: newStatus,
      approves_count: approves,
      flags_count: flags,
      eligible_voters: eligibleVoters,
      majority_needed: majority,
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

// DELETE /api/contributions/[id]/vote — retract the signed-in user's own
// vote entirely (back to no vote), rather than switching it to the other
// type. Lets the Approve/Flag buttons act as a real toggle: clicking the
// one you already picked undoes it instead of being a no-op re-submit.
export async function DELETE(request, context) {
  try {
    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (isFaculty(session)) {
      return NextResponse.json(
        { error: "Forbidden: Faculty accounts cannot vote on contributions." },
        { status: 403 }
      );
    }

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

    await pool.query(
      `DELETE FROM contribution_votes WHERE contribution_id = $1 AND user_id = $2`,
      [contributionId, session.user.dbId]
    );

    const { approves, flags, eligibleVoters, majority, newStatus } = await recomputeStatus(
      contributionId,
      contribution.project_id,
      contribution.user_id
    );
    const voteRows = await fetchVoteHistory(contributionId);

    return NextResponse.json({
      success: true,
      contributionId,
      status: newStatus,
      approves_count: approves,
      flags_count: flags,
      eligible_voters: eligibleVoters,
      majority_needed: majority,
      my_vote: null,
      votes: voteRows,
    });
  } catch (err) {
    console.error("DELETE /api/contributions/[id]/vote error:", err);
    return NextResponse.json(
      { error: "Failed to retract vote" },
      { status: 500 }
    );
  }
}
