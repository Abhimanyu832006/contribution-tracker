import { auth } from "@/auth";
import pool from "@/lib/db";
import { getActiveMembership, isFaculty } from "@/lib/auth";
import { NextResponse } from "next/server";

// POST /api/contributions/[id]/resolve — project-leader tie-break for a
// 'contested' contribution (an exact split among every eligible voter).
// Deliberately restricted to contributions that are actually contested,
// rather than a general "leader can override any status" escalation
// hatch — the peer-vote outcome should stand whenever it produced a real
// majority; this only exists to unstick the one case voting genuinely
// can't resolve on its own.
export async function POST(request, context) {
  try {
    const session = await auth();
    if (!session?.user?.dbId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (isFaculty(session)) {
      return NextResponse.json(
        { error: "Forbidden: Faculty accounts cannot resolve contributions." },
        { status: 403 }
      );
    }

    const membership = await getActiveMembership(session.user.dbId);
    if (!membership) {
      return NextResponse.json(
        { error: "Forbidden: You must belong to a project to resolve contributions." },
        { status: 403 }
      );
    }
    if (membership.role !== "leader") {
      return NextResponse.json(
        { error: "Forbidden: Only the project leader can break a tied vote." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const contributionId = parseInt(id, 10);
    if (isNaN(contributionId)) {
      return NextResponse.json({ error: "Invalid contribution ID" }, { status: 400 });
    }

    const body = await request.json();
    const { decision } = body;
    if (!decision || !["verified", "flagged"].includes(decision)) {
      return NextResponse.json(
        { error: "Decision must be either 'verified' or 'flagged'" },
        { status: 400 }
      );
    }

    const { rows } = await pool.query(
      "SELECT id, project_id, status FROM contributions WHERE id = $1",
      [contributionId]
    );
    const contribution = rows[0];
    if (!contribution) {
      return NextResponse.json({ error: "Contribution not found" }, { status: 404 });
    }
    if (contribution.project_id !== membership.project_id) {
      return NextResponse.json({ error: "Contribution belongs to another project" }, { status: 403 });
    }
    if (contribution.status !== "contested") {
      return NextResponse.json(
        { error: "Only a contested (tied) contribution can be resolved this way." },
        { status: 400 }
      );
    }

    await pool.query("UPDATE contributions SET status = $1 WHERE id = $2", [decision, contributionId]);

    return NextResponse.json({ success: true, contributionId, status: decision });
  } catch (err) {
    console.error("POST /api/contributions/[id]/resolve error:", err);
    return NextResponse.json(
      { error: "Failed to resolve contribution" },
      { status: 500 }
    );
  }
}
