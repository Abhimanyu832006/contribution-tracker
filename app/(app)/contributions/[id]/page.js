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
  const spineColor = isGithub ? "#1a3fd6" : "#ff4713";
  const stamp =
    c.status === "flagged"
      ? { bg: "#e11d2e", fg: "#f4f2ec", label: "flagged" }
      : c.status === "verified" || c.status === "approved"
      ? { bg: "#16a34a", fg: "#f4f2ec", label: "verified" }
      : null;

  return (
    <div className="space-y-6 max-w-2xl">
      <Link
        href="/contributions"
        className="font-mono text-xs uppercase tracking-wider text-[#928c78] hover:text-[#0e0d0b] inline-flex items-center gap-1.5"
      >
        ← Back to contributions
      </Link>

      <Card padding="p-0" className="overflow-hidden">
        <div className="flex">
          <div className="w-3 shrink-0" style={{ backgroundColor: spineColor }} />
          <div className="flex-1 p-6 sm:p-8 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-5 border-b-2 border-[#0e0d0b]">
              <div className="flex items-start gap-3.5">
                <Avatar src={c.avatar_url} name={c.github_username} size="lg" />
                <div>
                  <p className="font-[family-name:var(--font-poster)] text-2xl leading-none">
                    {c.github_username?.toUpperCase()}
                  </p>
                  <p className="font-mono text-xs text-[#928c78] mt-2">{formatDate(c.created_at)}</p>
                </div>
              </div>
              {stamp ? (
                <span className="stamp-solid shrink-0" style={{ backgroundColor: stamp.bg, color: stamp.fg }}>
                  {stamp.label}
                </span>
              ) : (
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#eab308] bg-[#fef3c7] rounded-[3px] px-2.5 py-1 shrink-0">
                  pending
                </span>
              )}
            </div>

            {/* Category + Source */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={CATEGORY_BADGE_MAP[c.category] || "default"}>{c.category}</Badge>
              <span
                className="font-mono text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-[2px]"
                style={{ backgroundColor: spineColor, color: isGithub ? "#f4f2ec" : "#0e0d0b" }}
              >
                {isGithub ? "GitHub" : "Manual"}
              </span>
            </div>

            {/* Description */}
            <div>
              <p className="label-mono mb-1.5">Description</p>
              <p className={`leading-relaxed ${isGithub ? "font-mono text-sm" : "font-serif text-xl"}`}>
                {c.description}
              </p>
            </div>

            {isGithub ? (
              /* GitHub-specific fields */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#e8e5db]">
                <div>
                  <p className="label-mono mb-1">Commit SHA</p>
                  <p className="text-sm font-mono bg-[#e3e9ff] inline-block px-2 py-1 rounded-[2px]">
                    {c.commit_sha ? c.commit_sha.slice(0, 10) : "—"}
                  </p>
                </div>
                <div>
                  <p className="label-mono mb-1">Commit link</p>
                  {c.commit_url ? (
                    <a
                      href={c.commit_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[#1a3fd6] hover:underline font-semibold"
                    >
                      View on GitHub ↗
                    </a>
                  ) : (
                    <p className="text-sm text-[#928c78]">—</p>
                  )}
                </div>
              </div>
            ) : (
              /* Manual-specific fields */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#e8e5db]">
                <div>
                  <p className="label-mono mb-1">Time estimate</p>
                  <p className="stat-num text-3xl">
                    {Number(c.time_estimate).toFixed(1)}h
                  </p>
                </div>
                {c.attachment_url && (
                  <div>
                    <p className="label-mono mb-1">Supporting evidence</p>
                    <a
                      href={c.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={c.attachment_name || true}
                      className="inline-flex items-center gap-2 font-mono text-xs text-[#55503f] hover:text-[#0e0d0b] underline decoration-[rgba(14,13,11,0.3)]"
                    >
                      ⌷ {c.attachment_name || "Download"}
                      {c.attachment_size && ` (${formatBytes(c.attachment_size)})`}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Verification history */}
            <div className="pt-4 border-t border-[#e8e5db]">
              <p className="label-mono mb-3">
                Verification — {c.approves_count} approve{c.approves_count === 1 ? "" : "s"}
                {c.flags_count > 0 ? `, ${c.flags_count} flagged` : ""}
              </p>
              {c.votes.length === 0 ? (
                <p className="text-sm text-[#928c78]">No teammates have reviewed this yet.</p>
              ) : (
                <div className="space-y-3">
                  {c.votes.map((v, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <Avatar src={v.avatar_url} name={v.username} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm">
                          <span className="font-semibold">{v.username}</span>{" "}
                          <span
                            className="font-mono uppercase tracking-wide"
                            style={{ color: v.vote === "approve" ? "#16a34a" : "#e11d2e" }}
                          >
                            {v.vote === "approve" ? "approved" : "flagged"}
                          </span>{" "}
                          <span className="font-mono text-xs text-[#928c78]">{formatDate(v.created_at)}</span>
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
          </div>
        </div>
      </Card>
    </div>
  );
}
