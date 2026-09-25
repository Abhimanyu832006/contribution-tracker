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
      <div className="brutal-card border-dashed py-16 text-center animate-fade-in">
        <div className="text-[var(--color-text-muted)] mb-3">
          <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <p className="text-sm font-bold text-[var(--color-text-primary)]">No contributions yet</p>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">Log your first one to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 stagger-children">
      {contributions.map((c) => {
        const isGithub = c.source === "github";
        const isGoogleDocs = c.source === "google_docs";
        const sourceColor = isGithub ? "var(--color-github)" : isGoogleDocs ? "var(--color-contributions)" : "var(--color-manual)";

        // Row itself is a plain container — never an <a>/<Link>, since it may
        // contain the attachment link below and nested anchors are invalid HTML.
        // Navigation is instead offered via the explicit link at the end of the row.
        return (
          <div
            key={c.id}
            className="bg-[var(--color-surface)] rounded border border-[var(--color-border)] brutal-shadow-sm px-5 py-4 flex items-center gap-4 transition-all duration-200 hover:brutal-shadow"
            style={{ borderLeft: `6px solid ${sourceColor}` }}
          >
            {/* Avatar */}
            <Avatar
              src={c.avatar_url}
              name={c.github_username || c.user_name}
              size="sm"
            />

            {/* Category badge */}
            <Badge variant={CATEGORY_BADGE_MAP[c.category] || "default"}>
              {c.category}
            </Badge>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate flex items-center gap-2">
                  {c.description}
                  {isGithub && (
                    <svg className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  )}
                </p>
                {c.attachment_url && (c.attachment_count || 1) <= 1 ? (
                  <a
                    href={c.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={c.attachment_name || true}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold text-[var(--color-github)] bg-[var(--color-github-light)] border border-[var(--color-border)] rounded hover:brutal-shadow-sm transition-all shrink-0"
                    title={`Download ${c.attachment_name || "document"}`}
                  >
                    <svg className="w-3 h-3 text-[var(--color-github)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.373L8.559 18.32a1.5 1.5 0 01-2.122-2.122l8.76-8.76" />
                    </svg>
                    <span className="truncate max-w-[120px]">{c.attachment_name || "Attachment"}</span>
                  </a>
                ) : c.attachment_count > 1 ? (
                  <Link
                    href={`/contributions/${c.id}`}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold text-[var(--color-github)] bg-[var(--color-github-light)] border border-[var(--color-border)] rounded hover:brutal-shadow-sm transition-all shrink-0"
                    title={`${c.attachment_count} supporting files`}
                  >
                    <svg className="w-3 h-3 text-[var(--color-github)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.373L8.559 18.32a1.5 1.5 0 01-2.122-2.122l8.76-8.76" />
                    </svg>
                    {c.attachment_count} files
                  </Link>
                ) : null}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-[var(--color-text-muted)]">
                  {c.github_username || c.user_name}
                </p>
                <Badge variant={isGithub ? "blue" : isGoogleDocs ? "blue" : "yellow"} className="!text-xs !px-1.5 !py-0">
                  {isGithub ? "GitHub" : isGoogleDocs ? "Google Docs" : "Manual"}
                </Badge>
                {c.status && (
                  <Badge
                    variant={
                      c.status === "verified" || c.status === "approved"
                        ? "green"
                        : c.status === "flagged"
                        ? "red"
                        : "yellow"
                    }
                    className="!text-xs !px-1.5 !py-0 capitalize"
                  >
                    {c.status === "approved" ? "verified" : c.status}
                  </Badge>
                )}
              </div>
            </div>

            {/* Hours + time */}
            <div className="text-right shrink-0">
              {!isGithub && !isGoogleDocs && (
                <p className="text-sm font-semibold text-[var(--color-primary)]">
                  {Number(c.time_estimate).toFixed(1)} hrs
                </p>
              )}
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                {timeAgo(c.created_at)}
              </p>
            </div>

            {/* Navigation */}
            {isGithub && c.commit_url ? (
              <a
                href={c.commit_url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                title="View commit on GitHub"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ) : isGoogleDocs && c.doc_url ? (
              <a
                href={c.doc_url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                title="Open in Google Docs"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ) : (
              <Link
                href={`/contributions/${c.id}`}
                className="shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
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
