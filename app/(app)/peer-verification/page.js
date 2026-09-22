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
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Peer Verification &amp; Document Review
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Review teammates&apos; work, inspect uploaded Word / research documents, and vote to verify or flag contributions
            </p>
          </div>
        </div>

        {/* Info guide card */}
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
          <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg shrink-0 mt-0.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            <p className="font-semibold text-gray-800 text-sm">How Peer Review Works</p>
            <p>
              • Click on any attached <strong>Word document (.docx)</strong>, <strong>PDF</strong>, or <strong>Research dataset</strong> to download and inspect it.
            </p>
            <p>
              • Vote <strong>Approve</strong> if the hours and deliverables are accurate. When <strong>2+ teammates approve</strong> with 0 flags, the work is marked as <strong>Verified</strong>.
            </p>
            <p>
              • Vote <strong>Flag</strong> if work is inflated, missing, or inaccurate. Flagged contributions will require team resolution.
            </p>
          </div>
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
