"use client";

import Link from "next/link";
import Badge, { CATEGORY_BADGE_MAP } from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function timeAgo(iso) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

const STATUS_COLOR = {
  verified: "#2c4a2e",
  approved: "#2c4a2e",
  flagged: "#b3271e",
  pending: "#7a5c00",
};

export default function ContributionList({ contributions = [] }) {
  if (contributions.length === 0) {
    return (
      <div className="border border-dashed border-[rgba(20,19,17,0.3)] py-16 text-center">
        <p className="text-sm text-[#8a8578]">No contributions yet</p>
        <p className="label-mono mt-1">LOG THE FIRST ONE TO GET STARTED</p>
      </div>
    );
  }

  return (
    <div className="border-t border-[rgba(20,19,17,0.14)]">
      {contributions.map((c) => {
        const isGithub = c.source === "github";
        const statusColor = STATUS_COLOR[c.status] || "#8a8578";

        // Row itself is a plain container — never an <a>/<Link>, since it may
        // contain the attachment link below and nested anchors are invalid HTML.
        // Navigation is instead offered via the explicit link at the end of the row.
        return (
          <div
            key={c.id}
            className={`flex items-center gap-4 py-3.5 pl-4 pr-1 border-b border-[rgba(20,19,17,0.14)] border-l-2 transition-colors hover:bg-[#faf9f5] ${
              isGithub ? "border-l-[#ff4b12]" : "border-l-[#141311]"
            }`}
          >
            {/* Source tag — the primary visual distinction */}
            <span className="label-mono w-14 shrink-0">
              {isGithub ? "GH" : "MANUAL"}
            </span>

            {/* Avatar */}
            <Avatar
              src={c.avatar_url}
              name={c.github_username || c.user_name}
              size="sm"
            />

            {/* Category badge */}
            <Badge variant={CATEGORY_BADGE_MAP[c.category] || "default"} className="shrink-0">
              {c.category}
            </Badge>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm truncate">
                  {c.description}
                </p>
                {c.attachment_url && (
                  <a
                    href={c.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={c.attachment_name || true}
                    className="font-mono text-[10px] uppercase tracking-wider text-[#4a473f] hover:text-[#141311] underline decoration-[rgba(20,19,17,0.3)] shrink-0"
                    title={`Download ${c.attachment_name || "document"}`}
                  >
                    ⌷ {c.attachment_name || "Attachment"}
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="font-mono text-xs text-[#8a8578]">
                  {c.github_username || c.user_name}
                </p>
                {c.status && (
                  <span
                    className="font-mono text-[10px] uppercase tracking-wider"
                    style={{ color: statusColor }}
                  >
                    {c.status === "approved" ? "verified" : c.status}
                  </span>
                )}
              </div>
            </div>

            {/* Hours + time */}
            <div className="text-right shrink-0 font-mono text-xs">
              {!isGithub && (
                <p className="text-sm text-[#141311]">
                  {Number(c.time_estimate).toFixed(1)}h
                </p>
              )}
              <p className="text-[#8a8578] mt-0.5">
                {timeAgo(c.created_at)}
              </p>
            </div>

            {/* Navigation */}
            {isGithub && c.commit_url ? (
              <a
                href={c.commit_url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-[#8a8578] hover:text-[#ff4b12] transition-colors"
                title="View commit on GitHub"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ) : (
              <Link
                href={`/contributions/${c.id}`}
                className="shrink-0 text-[#8a8578] hover:text-[#141311] transition-colors"
                title="View details"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
