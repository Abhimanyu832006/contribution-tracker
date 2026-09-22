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
  const statusVariant =
    c.status === "verified" || c.status === "approved"
      ? "green"
      : c.status === "flagged"
      ? "red"
      : "yellow";
  const statusLabel =
    c.status === "approved" ? "verified" : c.status || "pending";

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <Link
        href="/contributions"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back to Contributions
      </Link>

      <Card className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <Avatar src={c.avatar_url} name={c.github_username} size="lg" />
            <div>
              <p className="text-base font-semibold text-gray-900">{c.github_username}</p>
              <p className="text-xs text-gray-500 mt-0.5">{formatDate(c.created_at)}</p>
            </div>
          </div>
          <Badge variant={statusVariant} className="uppercase font-bold shrink-0">
            {statusLabel}
          </Badge>
        </div>

        {/* Category + Source */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={CATEGORY_BADGE_MAP[c.category] || "default"}>{c.category}</Badge>
          <Badge variant={isGithub ? "indigo" : "default"}>
            {isGithub ? "GitHub" : "Manual"}
          </Badge>
        </div>

        {/* Description */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
            Description
          </p>
          <p className="text-sm text-gray-800 leading-relaxed">{c.description}</p>
        </div>

        {isGithub ? (
          /* GitHub-specific fields */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Commit SHA
              </p>
              <p className="text-sm font-mono text-gray-800">
                {c.commit_sha ? c.commit_sha.slice(0, 10) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Commit Link
              </p>
              {c.commit_url ? (
                <a
                  href={c.commit_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-1"
                >
                  View on GitHub
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ) : (
                <p className="text-sm text-gray-400">—</p>
              )}
            </div>
          </div>
        ) : (
          /* Manual-specific fields */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Time Estimate
              </p>
              <p className="text-sm font-semibold text-indigo-600">
                {Number(c.time_estimate).toFixed(1)} hrs
              </p>
            </div>
            {c.attachment_url && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Supporting Evidence
                </p>
                <a
                  href={c.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={c.attachment_name || true}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50/80 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  {c.attachment_name || "Download"}
                  {c.attachment_size && (
                    <span className="text-indigo-500 font-normal">
                      ({formatBytes(c.attachment_size)})
                    </span>
                  )}
                </a>
              </div>
            )}
          </div>
        )}

        {/* Verification history */}
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Verification ({c.approves_count} approve{c.approves_count === 1 ? "" : "s"}
            {c.flags_count > 0 ? `, ${c.flags_count} flagged` : ""})
          </p>
          {c.votes.length === 0 ? (
            <p className="text-sm text-gray-400">No teammates have reviewed this yet.</p>
          ) : (
            <div className="space-y-3">
              {c.votes.map((v, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Avatar src={v.avatar_url} name={v.username} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">{v.username}</span>{" "}
                      <span
                        className={
                          v.vote === "approve"
                            ? "text-emerald-600 font-medium"
                            : "text-red-600 font-medium"
                        }
                      >
                        {v.vote === "approve" ? "approved" : "flagged"}
                      </span>{" "}
                      <span className="text-gray-400 text-xs">{formatDate(v.created_at)}</span>
                    </p>
                    {v.comment && (
                      <p className="text-sm text-gray-500 italic mt-0.5">&ldquo;{v.comment}&rdquo;</p>
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
