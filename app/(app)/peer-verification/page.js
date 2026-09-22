import { requireProject } from "@/lib/auth";
import pool, { ensureSchema } from "@/lib/db";
import PeerVerificationList from "@/components/PeerVerificationList";

export const metadata = {
  title: "Peer Verification — Contribution Tracker",
};

export default async function PeerVerificationPage() {
  const session = await requireProject();
  const projectId = session.user.projectId;
  const currentUserId = session.user.dbId;

  await ensureSchema();

  const { rows: contributions } = await pool.query(
    `SELECT
       c.id,
       c.user_id,
       c.category,
       c.description,
       c.time_estimate,
       c.status,
       c.source,
       c.created_at,
       c.attachment_url,
       c.attachment_name,
       c.attachment_size,
       c.attachment_type,
       u.github_username,
       u.avatar_url,
       COALESCE(COUNT(v.id) FILTER (WHERE v.vote = 'approve'), 0)::int AS approves_count,
       COALESCE(COUNT(v.id) FILTER (WHERE v.vote = 'flag'), 0)::int AS flags_count,
       MAX(CASE WHEN v.user_id = $2 THEN v.vote ELSE NULL END) AS my_vote,
       COALESCE(
         json_agg(
           jsonb_build_object(
             'username', vu.github_username,
             'avatar_url', vu.avatar_url,
             'vote', v.vote,
             'comment', v.comment,
             'created_at', v.created_at
           ) ORDER BY v.created_at DESC
         ) FILTER (WHERE v.id IS NOT NULL),
         '[]'
       ) AS votes
     FROM contributions c
     JOIN users u ON u.id = c.user_id
     LEFT JOIN contribution_votes v ON v.contribution_id = c.id
     LEFT JOIN users vu ON vu.id = v.user_id
     WHERE c.project_id = $1
     GROUP BY c.id, u.github_username, u.avatar_url
     ORDER BY c.created_at DESC`,
    [projectId, currentUserId]
  );

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="rule-strong-b pb-5">
        <p className="label-mono mb-2">PEER VERIFICATION</p>
        <h1 className="font-serif text-4xl sm:text-5xl leading-none">
          Verification &amp; Review
        </h1>
        <p className="text-sm text-[#55503f] mt-3 max-w-xl">
          Review teammates&apos; work, inspect supporting documents, and vote to verify or flag contributions.
        </p>

        {/* Rule guide — how peer review works */}
        <div className="mt-4 text-xs text-[#55503f] space-y-1 font-mono">
          <p>→ Open any attached document to inspect it before voting.</p>
          <p>→ 2+ approvals with 0 flags marks a contribution VERIFIED.</p>
          <p>→ Any flag marks it FLAGGED, pending team resolution.</p>
        </div>
      </div>

      {/* Peer Verification interactive list */}
      <PeerVerificationList
        initialContributions={contributions}
        currentUserId={currentUserId}
      />
    </div>
  );
}
