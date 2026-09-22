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

export default function ContributionList({ contributions = [] }) {
  if (contributions.length === 0) {
    return (
      <div className="border-2 border-dashed border-[#928c78] rounded-[3px] py-16 text-center">
        <p className="text-sm text-[#928c78]">No contributions yet</p>
        <p className="label-mono mt-1">LOG THE FIRST ONE TO GET STARTED</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {contributions.map((c, i) => {
        const isGithub = c.source === "github";
        const spineColor = isGithub ? "#1a3fd6" : "#ff4713";
        const stamp =
          c.status === "flagged"
            ? { bg: "#e11d2e", fg: "#f4f2ec", label: "flagged" }
            : c.status === "verified" || c.status === "approved"
            ? { bg: "#16a34a", fg: "#f4f2ec", label: "verified" }
            : null;

        return (
          <div
            key={c.id}
            className="flex rounded-[3px] border-2 border-[#0e0d0b] overflow-hidden bg-white transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_rgba(14,13,11,0.9)]"
          >
            {/* Solid color spine — the source signal, unmissable */}
            <div className="w-2 sm:w-3 shrink-0" style={{ backgroundColor: spineColor }} />

            {/* Index number — poster voice, event-numbered */}
            <div
              className="hidden sm:flex flex-col items-center justify-center w-16 shrink-0 border-r-2 border-[#0e0d0b]"
              style={{ backgroundColor: isGithub ? "#e3e9ff" : "#ffe9df" }}
            >
              <span className="stat-num text-2xl" style={{ color: spineColor }}>
                {String(i + 1).padStart(2, "0")}
              </span>
            </div>

            <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 sm:px-5 py-4 min-w-0">
              <Avatar
                src={c.avatar_url}
                name={c.github_username || c.user_name}
                size="sm"
                className="shrink-0"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold">
                    {c.github_username || c.user_name}
                  </span>
                  <span
                    className="font-mono text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: spineColor }}
                  >
                    {isGithub ? "GITHUB" : "MANUAL"}
                  </span>
                  <Badge variant={CATEGORY_BADGE_MAP[c.category] || "default"}>
                    {c.category}
                  </Badge>
                </div>
                <p className={`mt-0.5 truncate ${isGithub ? "font-mono text-[13px] text-[#55503f]" : "font-serif text-[15px]"}`}>
                  {c.description}
                </p>
                {c.attachment_url && (
                  <a
                    href={c.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={c.attachment_name || true}
                    className="inline-flex items-center gap-1 mt-1 font-mono text-[10px] uppercase tracking-wider text-[#55503f] hover:text-[#0e0d0b] underline decoration-[rgba(14,13,11,0.3)]"
                    title={`Download ${c.attachment_name || "document"}`}
                  >
                    ⌷ {c.attachment_name || "Attachment"}
                  </a>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0 sm:flex-col sm:items-end sm:gap-1">
                {!isGithub && (
                  <span className="stat-num text-xl">{Number(c.time_estimate).toFixed(1)}h</span>
                )}
                {stamp ? (
                  <span className="stamp-solid" style={{ backgroundColor: stamp.bg, color: stamp.fg }}>
                    {stamp.label}
                  </span>
                ) : (
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#eab308]">
                    pending
                  </span>
                )}
                <span className="font-mono text-[10px] text-[#928c78]">{timeAgo(c.created_at)}</span>
              </div>

              {isGithub && c.commit_url ? (
                <a
                  href={c.commit_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-[#928c78] hover:text-[#1a3fd6] transition-colors"
                  title="View commit on GitHub"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ) : (
                <Link
                  href={`/contributions/${c.id}`}
                  className="shrink-0 text-[#928c78] hover:text-[#0e0d0b] transition-colors"
                  title="View details"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
