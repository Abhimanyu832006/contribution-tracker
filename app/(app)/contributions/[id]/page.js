import { notFound } from "next/navigation";
import Link from "next/link";
import { requireProject } from "@/lib/auth";
import pool from "@/lib/db";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import { CATEGORY_BADGE_MAP } from "@/lib/constants";

export const metadata = {
  title: "Contribution Details — Contribution Tracker",
};

function formatDate(iso) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBytes(bytes) {
  if (!bytes) return "";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default async function ContributionDetailPage({ params }) {
  const { id } = await params;
  const contributionId = parseInt(id, 10);
  if (isNaN(contributionId)) notFound();

  const session = await requireProject();
  const projectId = session.user.projectId;

  const { rows } = await pool.query(
    `SELECT
       c.id, c.user_id, c.category, c.description, c.time_estimate, c.status,
       c.source, c.commit_sha, c.commit_url, c.attachment_url, c.attachment_name,
       c.attachment_size, c.attachment_type, c.created_at, c.project_id,
       u.github_username, u.avatar_url,
       COALESCE(COUNT(v.id) FILTER (WHERE v.vote = 'approve'), 0)::int AS approves_count,
       COALESCE(COUNT(v.id) FILTER (WHERE v.vote = 'flag'), 0)::int AS flags_count,
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
     WHERE c.id = $1
     GROUP BY c.id, u.github_username, u.avatar_url`,
    [contributionId]
  );

  const c = rows[0];

  // Not found, or belongs to a different project than the viewer's active one
  if (!c || c.project_id !== projectId) notFound();

  const isGithub = c.source === "github";
  const stampColor =
    c.status === "verified" || c.status === "approved"
      ? "#2f5c3f"
      : c.status === "flagged"
      ? "#9c1f1f"
      : "#8a6a1f";
  const statusLabel =
    c.status === "approved" ? "verified" : c.status || "pending";

  return (
    <div className="space-y-6 max-w-2xl">
      <Link
        href="/contributions"
        className="label-mono hover:text-[#1c1a15] inline-flex items-center gap-1.5"
      >
        ← BACK TO CONTRIBUTIONS
      </Link>

      <Card className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 rule-b pb-5">
          <div className="flex items-start gap-3.5">
            <Avatar src={c.avatar_url} name={c.github_username} size="lg" />
            <div>
              <p className="font-serif text-2xl leading-none">{c.github_username}</p>
              <p className="font-mono text-xs text-[#96907a] mt-1.5">{formatDate(c.created_at)}</p>
            </div>
          </div>
          {statusLabel === "pending" ? (
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#96907a] shrink-0">
              awaiting review
            </span>
          ) : (
            <span className="rubber-stamp shrink-0" style={{ color: stampColor }}>
              {statusLabel}
            </span>
          )}
        </div>

        {/* Category + Source */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={CATEGORY_BADGE_MAP[c.category] || "default"}>{c.category}</Badge>
          <span
            className="label-mono"
            style={{ color: isGithub ? "#1f6f66" : "#a4451f" }}
          >
            {isGithub ? "SOURCE: GITHUB" : "SOURCE: MANUAL"}
          </span>
        </div>

        {/* Description */}
        <div>
          <p className="label-mono mb-1.5">DESCRIPTION</p>
          <p className={`leading-relaxed ${isGithub ? "font-mono text-sm" : "font-serif text-lg"}`}>
            {c.description}
          </p>
        </div>

        {isGithub ? (
          /* GitHub-specific fields */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rule-t pt-4">
            <div>
              <p className="label-mono mb-1">COMMIT SHA</p>
              <p className="text-sm font-mono">
                {c.commit_sha ? c.commit_sha.slice(0, 10) : "—"}
              </p>
            </div>
            <div>
              <p className="label-mono mb-1">COMMIT LINK</p>
              {c.commit_url ? (
                <a
                  href={c.commit_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#1f6f66] hover:underline font-medium"
                >
                  View on GitHub ↗
                </a>
              ) : (
                <p className="text-sm text-[#96907a]">—</p>
              )}
            </div>
          </div>
        ) : (
          /* Manual-specific fields */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rule-t pt-4">
            <div>
              <p className="label-mono mb-1">TIME ESTIMATE</p>
              <p className="stat-num text-2xl">
                {Number(c.time_estimate).toFixed(1)}h
              </p>
            </div>
            {c.attachment_url && (
              <div>
                <p className="label-mono mb-1">SUPPORTING EVIDENCE</p>
                <a
                  href={c.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={c.attachment_name || true}
                  className="inline-flex items-center gap-2 font-mono text-xs text-[#55503f] hover:text-[#1c1a15] underline decoration-[rgba(28,26,21,0.3)]"
                >
                  ⌷ {c.attachment_name || "Download"}
                  {c.attachment_size && ` (${formatBytes(c.attachment_size)})`}
                </a>
              </div>
            )}
          </div>
        )}

        {/* Verification history */}
        <div className="rule-t pt-4">
          <p className="label-mono mb-3">
            VERIFICATION — {c.approves_count} APPROVE{c.approves_count === 1 ? "" : "S"}
            {c.flags_count > 0 ? `, ${c.flags_count} FLAGGED` : ""}
          </p>
          {c.votes.length === 0 ? (
            <p className="text-sm text-[#96907a]">No teammates have reviewed this yet.</p>
          ) : (
            <div className="space-y-3">
              {c.votes.map((v, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Avatar src={v.avatar_url} name={v.username} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{v.username}</span>{" "}
                      <span
                        className="font-mono uppercase tracking-wide"
                        style={{ color: v.vote === "approve" ? "#2f5c3f" : "#9c1f1f" }}
                      >
                        {v.vote === "approve" ? "approved" : "flagged"}
                      </span>{" "}
                      <span className="font-mono text-xs text-[#96907a]">{formatDate(v.created_at)}</span>
                    </p>
                    {v.comment && (
                      <p className="text-sm text-[#55503f] italic mt-0.5">&ldquo;{v.comment}&rdquo;</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
