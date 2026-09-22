"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { CATEGORY_BADGE_MAP } from "@/lib/constants";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "flagged", label: "Flagged" },
];

function timeAgo(iso) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatBytes(bytes) {
  if (!bytes) return "";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function PeerVerificationList({ initialContributions = [], currentUserId }) {
  const [contributions, setContributions] = useState(initialContributions);
  const [votingId, setVotingId] = useState(null);
  const [error, setError] = useState("");
  const [historyOpenId, setHistoryOpenId] = useState(null);
  const [commentDraft, setCommentDraft] = useState({});
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const filteredContributions = useMemo(() => {
    return contributions.filter((c) => {
      if (statusFilter) {
        const status = c.status || "pending";
        const matchesVerified = statusFilter === "verified" && (status === "verified" || status === "approved");
        if (!matchesVerified && status !== statusFilter) return false;
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const haystack = `${c.description || ""} ${c.github_username || ""} ${c.category || ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [contributions, statusFilter, search]);

  async function handleVote(contributionId, voteType) {
    setVotingId(contributionId);
    setError("");

    try {
      const res = await fetch(`/api/contributions/${contributionId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vote: voteType,
          comment: commentDraft[contributionId]?.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit vote");
      }

      setContributions((prev) =>
        prev.map((c) => {
          if (c.id === contributionId) {
            return {
              ...c,
              status: data.status,
              approves_count: data.approves_count,
              flags_count: data.flags_count,
              my_vote: data.my_vote,
              votes: data.votes ?? c.votes,
            };
          }
          return c;
        })
      );
      setCommentDraft((prev) => ({ ...prev, [contributionId]: "" }));
    } catch (err) {
      setError(err.message);
    } finally {
      setVotingId(null);
    }
  }

  if (contributions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
        <div className="text-gray-300 mb-3">
          <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <p className="text-sm text-gray-400">No contributions to verify yet</p>
        <p className="text-xs text-gray-300 mt-1">Log contributions with documentation or research first</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 animate-scale-in">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                statusFilter === tab.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search description or contributor…"
          className="sm:w-72 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 hover:border-gray-300"
        />
      </div>

      {filteredContributions.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <p className="text-sm text-gray-400">No contributions match these filters</p>
        </div>
      )}

      <div className="space-y-3 stagger-children">
        {filteredContributions.map((c) => {
          const isOwnContribution = c.user_id === currentUserId;
          const isVotingThis = votingId === c.id;
          const hasVotedApprove = c.my_vote === "approve";
          const hasVotedFlag = c.my_vote === "flag";

          return (
            <Card
              key={c.id}
              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 hover:shadow-md"
            >
              {/* Left Info: Author, Category, Description, Attached File */}
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <Avatar src={c.avatar_url} name={c.github_username} size="md" />

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">
                      {c.github_username}
                    </span>
                    <Badge variant={CATEGORY_BADGE_MAP[c.category] || "default"}>
                      {c.category}
                    </Badge>
                    <Link
                      href={`/contributions/${c.id}`}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      View details
                    </Link>
                    <span className="text-xs text-gray-400">
                      {timeAgo(c.created_at)}
                    </span>
                    {isOwnContribution && (
                      <Badge variant="default" className="!text-[10px] !bg-gray-100 !text-gray-600">
                        You
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-gray-800 font-medium break-words">
                    {c.description}
                  </p>

                  {/* Verification history toggle */}
                  {(c.votes?.length || 0) > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setHistoryOpenId((prev) => (prev === c.id ? null : c.id))
                      }
                      className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors inline-flex items-center gap-1"
                    >
                      <svg
                        className={`w-3 h-3 transition-transform ${historyOpenId === c.id ? "rotate-90" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                      {historyOpenId === c.id ? "Hide" : "Show"} verification history ({c.votes.length})
                    </button>
                  )}

                  {historyOpenId === c.id && (c.votes?.length || 0) > 0 && (
                    <div className="space-y-2 pt-1 pl-1 border-l-2 border-gray-100 animate-scale-in">
                      {c.votes.map((v, i) => (
                        <div key={i} className="flex items-start gap-2 pl-3">
                          <Avatar src={v.avatar_url} name={v.username} size="xs" />
                          <div className="min-w-0">
                            <p className="text-xs text-gray-700">
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
                              this contribution
                            </p>
                            {v.comment && (
                              <p className="text-xs text-gray-500 italic mt-0.5">
                                &ldquo;{v.comment}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Supporting Document Pill */}
                  {c.attachment_url && (
                    <div className="pt-1">
                      <a
                        href={c.attachment_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={c.attachment_name || true}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50/80 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors shadow-xs group"
                        title="Download and inspect supporting document"
                      >
                        <svg className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        <span className="font-semibold truncate max-w-[200px] sm:max-w-xs">
                          {c.attachment_name || "Download Document"}
                        </span>
                        {c.attachment_size && (
                          <span className="text-indigo-500 font-normal text-[11px]">
                            ({formatBytes(c.attachment_size)})
                          </span>
                        )}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Info: Time, Live Votes, & Voting Action Buttons */}
              <div className="flex items-center justify-between md:justify-end gap-5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                {/* Time and verification status badge */}
                <div className="text-left md:text-right">
                  <div className="flex items-center md:justify-end gap-1.5">
                    <span className="text-sm font-bold text-gray-900">
                      {Number(c.time_estimate).toFixed(1)} hrs
                    </span>
                    <Badge
                      variant={
                        c.status === "verified"
                          ? "green"
                          : c.status === "flagged"
                          ? "red"
                          : "yellow"
                      }
                      className="!text-[10px] uppercase font-bold"
                    >
                      {c.status || "pending"}
                    </Badge>
                  </div>

                  {/* Votes count summary */}
                  <div className="flex items-center md:justify-end gap-2 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                      {c.approves_count || 0} approve{c.approves_count === 1 ? "" : "s"}
                    </span>
                    {(c.flags_count || 0) > 0 && (
                      <span className="flex items-center gap-1 text-red-600 font-medium">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v10a1 1 0 01-1 1H5.414l-2.707 2.707A1 1 0 011 16V4a1 1 0 011-1h1zm2 3a1 1 0 012 0v3a1 1 0 11-2 0V6zm1 7a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                        {c.flags_count} flagged
                      </span>
                    )}
                  </div>
                </div>

                {/* Vote Action Buttons */}
                <div className="flex flex-col items-end gap-2">
                  {isOwnContribution ? (
                    <span className="text-xs text-gray-400 italic px-2 py-1 bg-gray-50 rounded-lg">
                      Your contribution
                    </span>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={commentDraft[c.id] || ""}
                        onChange={(e) =>
                          setCommentDraft((prev) => ({ ...prev, [c.id]: e.target.value }))
                        }
                        placeholder="Optional comment (visible to the team)…"
                        maxLength={280}
                        className="w-full sm:w-56 text-xs rounded-lg border border-gray-200 px-2.5 py-1.5 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400"
                      />
                      <div className="flex items-center gap-2">
                      <Button
                        id={`approve-${c.id}`}
                        type="button"
                        size="sm"
                        disabled={isVotingThis}
                        onClick={() => handleVote(c.id, "approve")}
                        className={`transition-all ${
                          hasVotedApprove
                            ? "!bg-emerald-600 !text-white !border-emerald-600 shadow-sm"
                            : "text-emerald-700 bg-white border border-emerald-300 hover:bg-emerald-50"
                        }`}
                        title="Verify and approve teammate's work"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        {hasVotedApprove ? "Approved" : "Approve"}
                      </Button>

                      <Button
                        id={`flag-${c.id}`}
                        type="button"
                        size="sm"
                        disabled={isVotingThis}
                        onClick={() => handleVote(c.id, "flag")}
                        className={`transition-all ${
                          hasVotedFlag
                            ? "!bg-red-600 !text-white !border-red-600 shadow-sm"
                            : "text-red-600 bg-white border border-red-300 hover:bg-red-50"
                        }`}
                        title="Flag contribution if work is inaccurate or suspicious"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
                        </svg>
                        {hasVotedFlag ? "Flagged" : "Flag"}
                      </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
