"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { CATEGORY_BADGE_MAP } from "@/lib/constants";

const STATUS_TABS = [
  { value: "", label: "ALL" },
  { value: "pending", label: "PENDING" },
  { value: "verified", label: "VERIFIED" },
  { value: "flagged", label: "FLAGGED" },
];

const STAMP_STYLE = {
  verified: { color: "#2f5c3f", label: "VERIFIED" },
  approved: { color: "#2f5c3f", label: "VERIFIED" },
  flagged: { color: "#9c1f1f", label: "FLAGGED" },
  pending: { color: "#8a6a1f", label: "PENDING" },
};

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
      <div className="border border-dashed border-[rgba(28,26,21,0.3)] py-16 text-center">
        <p className="text-sm text-[#96907a]">No contributions to verify yet</p>
        <p className="label-mono mt-1">LOG CONTRIBUTIONS TO BEGIN PEER REVIEW</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="text-sm text-[#9c1f1f] border border-[#9c1f1f] px-4 py-3">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between rule-b pb-3">
        <div className="flex items-baseline gap-5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`label-mono !text-xs pb-1 ${
                statusFilter === tab.value
                  ? "text-[#1c1a15] border-b-2 border-[#a4451f] -mb-[13px]"
                  : "hover:text-[#1c1a15]"
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
          className="sm:w-72 rounded-none border border-[rgba(28,26,21,0.2)] bg-[#faf7f0] px-3.5 py-2 text-sm placeholder-[#96907a] focus:outline-none focus:border-[#1c1a15]"
        />
      </div>

      {filteredContributions.length === 0 && (
        <div className="border border-dashed border-[rgba(28,26,21,0.3)] py-16 text-center">
          <p className="text-sm text-[#96907a]">No contributions match these filters</p>
        </div>
      )}

      <div className="space-y-3">
        {filteredContributions.map((c) => {
          const isOwnContribution = c.user_id === currentUserId;
          const isVotingThis = votingId === c.id;
          const hasVotedApprove = c.my_vote === "approve";
          const hasVotedFlag = c.my_vote === "flag";
          const stamp = STAMP_STYLE[c.status] || STAMP_STYLE.pending;

          return (
            <Card
              key={c.id}
              padding="p-5"
              className="flex flex-col md:flex-row md:items-start justify-between gap-4"
            >
              {/* Left: Author, Category, Description, History, Attachment */}
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                <Avatar src={c.avatar_url} name={c.github_username} size="md" />

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-sm font-medium">
                      {c.github_username}
                    </span>
                    <span
                      className="font-mono text-[10px] uppercase tracking-wider"
                      style={{ color: c.source === "github" ? "#1f6f66" : "#a4451f" }}
                    >
                      {c.source === "github" ? "GH" : "MANUAL"}
                    </span>
                    <Badge variant={CATEGORY_BADGE_MAP[c.category] || "default"}>
                      {c.category}
                    </Badge>
                    <Link
                      href={`/contributions/${c.id}`}
                      className="label-mono !text-[#a4451f] hover:underline"
                    >
                      DETAILS
                    </Link>
                    <span className="font-mono text-xs text-[#96907a]">
                      {timeAgo(c.created_at)}
                    </span>
                    {isOwnContribution && (
                      <span className="label-mono">YOU</span>
                    )}
                  </div>

                  <p className={`break-words ${c.source === "github" ? "font-mono text-[13px]" : "font-serif text-[15px]"}`}>
                    {c.description}
                  </p>

                  {/* Verification history toggle */}
                  {(c.votes?.length || 0) > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setHistoryOpenId((prev) => (prev === c.id ? null : c.id))
                      }
                      className="label-mono hover:text-[#1c1a15] inline-flex items-center gap-1"
                    >
                      {historyOpenId === c.id ? "▾" : "▸"} HISTORY ({c.votes.length})
                    </button>
                  )}

                  {historyOpenId === c.id && (c.votes?.length || 0) > 0 && (
                    <div className="space-y-2 pt-1 pl-3 border-l-2 border-[rgba(28,26,21,0.14)]">
                      {c.votes.map((v, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Avatar src={v.avatar_url} name={v.username} size="xs" />
                          <div className="min-w-0">
                            <p className="text-xs">
                              <span className="font-medium">{v.username}</span>{" "}
                              <span
                                className="font-mono uppercase tracking-wide"
                                style={{ color: v.vote === "approve" ? "#2f5c3f" : "#9c1f1f" }}
                              >
                                {v.vote === "approve" ? "approved" : "flagged"}
                              </span>
                            </p>
                            {v.comment && (
                              <p className="text-xs text-[#55503f] italic mt-0.5">
                                &ldquo;{v.comment}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Supporting Document */}
                  {c.attachment_url && (
                    <a
                      href={c.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={c.attachment_name || true}
                      className="inline-flex items-center gap-2 font-mono text-xs text-[#55503f] hover:text-[#1c1a15] underline decoration-[rgba(28,26,21,0.3)]"
                      title="Download and inspect supporting document"
                    >
                      ⌷ {c.attachment_name || "Download Document"}
                      {c.attachment_size && ` (${formatBytes(c.attachment_size)})`}
                    </a>
                  )}
                </div>
              </div>

              {/* Right: stamp, tallies, vote actions */}
              <div className="flex items-start justify-between md:flex-col md:items-end gap-3 shrink-0 pt-3 md:pt-0 rule-t md:border-t-0">
                <div className="md:text-right">
                  <div className="flex items-center md:justify-end gap-2">
                    <span className="stat-num text-lg">
                      {Number(c.time_estimate).toFixed(1)}h
                    </span>
                    {c.status === "pending" || !c.status ? (
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#96907a]">
                        awaiting review
                      </span>
                    ) : (
                      <span className="rubber-stamp" style={{ color: stamp.color }}>
                        {stamp.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center md:justify-end gap-3 font-mono text-xs text-[#96907a] mt-1.5">
                    <span>{c.approves_count || 0} approve{c.approves_count === 1 ? "" : "s"}</span>
                    {(c.flags_count || 0) > 0 && (
                      <span className="text-[#9c1f1f]">{c.flags_count} flagged</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {isOwnContribution ? (
                    <span className="label-mono">YOUR CONTRIBUTION</span>
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
                        className="w-full sm:w-56 text-xs rounded-none border border-[rgba(28,26,21,0.2)] bg-[#faf7f0] px-2.5 py-1.5 placeholder:text-[#96907a] focus:outline-none focus:border-[#1c1a15]"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          id={`approve-${c.id}`}
                          type="button"
                          size="sm"
                          disabled={isVotingThis}
                          onClick={() => handleVote(c.id, "approve")}
                          className={
                            hasVotedApprove
                              ? "!bg-[#2f5c3f] !text-[#f2ede3] !border-[#2f5c3f]"
                              : "!text-[#2f5c3f] !border-[#2f5c3f] hover:!bg-[#2f5c3f] hover:!text-[#f2ede3]"
                          }
                          title="Verify and approve teammate's work"
                        >
                          {hasVotedApprove ? "Approved" : "Approve"}
                        </Button>

                        <Button
                          id={`flag-${c.id}`}
                          type="button"
                          size="sm"
                          disabled={isVotingThis}
                          onClick={() => handleVote(c.id, "flag")}
                          variant="danger"
                          className={hasVotedFlag ? "!bg-[#9c1f1f] !text-[#f2ede3]" : ""}
                          title="Flag contribution if work is inaccurate or suspicious"
                        >
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
