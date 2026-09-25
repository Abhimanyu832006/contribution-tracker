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
       COALESCE(u.display_name, u.github_username) AS github_username,
       u.avatar_url,
       COALESCE(COUNT(v.id) FILTER (WHERE v.vote = 'approve'), 0)::int AS approves_count,
       COALESCE(COUNT(v.id) FILTER (WHERE v.vote = 'flag'), 0)::int AS flags_count,
       MAX(CASE WHEN v.user_id = $2 THEN v.vote ELSE NULL END) AS my_vote,
       COALESCE(
         json_agg(
           jsonb_build_object(
             'username', COALESCE(vu.display_name, vu.github_username),
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
     GROUP BY c.id, u.id, u.avatar_url
     ORDER BY c.created_at DESC`,
    [projectId, currentUserId]
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-primary)]">
          Peer Verification
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-xl">
          Review teammates&apos; work, inspect supporting documents, and vote to verify or flag contributions.
        </p>

        {/* Info guide card */}
        <div className="mt-4 flex items-start gap-3 rounded border border-[var(--color-border)] bg-[var(--color-verification-light)] p-4">
          <div className="p-1.5 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-verification)] rounded shrink-0 mt-0.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-xs font-medium text-[var(--color-text-primary)] space-y-1">
            <p>
              • Open any attached document to inspect it before voting.
            </p>
            <p>
              • <strong>2+ approvals</strong> with 0 flags marks a contribution <strong style={{ color: "var(--color-success)" }}>Verified</strong>.
            </p>
            <p>
              • Any flag marks it <strong style={{ color: "var(--color-danger)" }}>Flagged</strong>, pending team resolution.
            </p>
          </div>
        </div>
      </div>

      {/* Peer Verification interactive list */}
      <PeerVerificationList
        initialContributions={contributions}
        currentUserId={currentUserId}
        isLeader={session.user.role === "leader"}
      />
    </div>
  );
}
