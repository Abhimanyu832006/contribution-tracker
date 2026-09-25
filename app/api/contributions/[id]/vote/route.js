import { auth } from "@/auth";
import pool, { ensureSchema } from "@/lib/db";
import { getActiveMembership, isFaculty } from "@/lib/auth";
import { NextResponse } from "next/server";

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

    // 4. Calculate total tallies + how many teammates are actually
    // eligible to vote on this (every current project member except the
    // contributor themselves — a member who has since left doesn't count,
    // and if the contributor has left, everyone currently on the project
    // is eligible).
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
        [contribution.project_id, contribution.user_id]
      ),
    ]);

    const { approves, flags } = tallyRows[0];
    const eligibleVoters = eligibleRows[0].eligible;

    // Status logic — a majority of the team's ELIGIBLE voters, not a
    // fixed "2 approvals" / "any single flag" rule, so that:
    //   - a lone biased or rival vote can no longer unilaterally flag
    //     someone's work (that used to be `flags > 0` -> flagged);
    //   - small teams (e.g. exactly 2 people) can actually reach
    //     'verified' at all — the old fixed threshold of 2 approvals was
    //     literally unreachable when only 1 teammate could ever vote.
    // A genuine tie among ALL eligible voters (nobody left to vote, and
    // the split is even) becomes 'contested' instead of defaulting either
    // way — the project leader breaks it via POST .../resolve.
    const majority = Math.floor(eligibleVoters / 2) + 1;
    const totalVotes = approves + flags;

    let newStatus;
    if (eligibleVoters === 0) {
      // Nobody else on the project can ever vote on this (e.g. a
      // solo project) — nothing to gate on, so it's accepted outright
      // rather than stuck pending forever.
      newStatus = "verified";
    } else if (approves >= majority) {
      newStatus = "verified";
    } else if (flags >= majority) {
      newStatus = "flagged";
    } else if (totalVotes >= eligibleVoters) {
      // Everyone eligible has voted and neither side reached a majority
      // — only possible as an exact tie. Needs a human tie-break.
      newStatus = "contested";
    } else {
      newStatus = "pending";
    }

    await pool.query(
      `UPDATE contributions SET status = $1 WHERE id = $2`,
      [newStatus, contributionId]
    );

    // Fetch the full, updated verification history for this contribution
    const { rows: voteRows } = await pool.query(
      `SELECT v.vote, v.comment, v.created_at, COALESCE(u.display_name, u.github_username) AS username, u.avatar_url
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
