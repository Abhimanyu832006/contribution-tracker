"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { CATEGORY_BADGE_MAP } from "@/lib/constants";

function formatDate(iso) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusVariant(status) {
  return status === "verified" || status === "approved"
    ? "green"
    : status === "flagged"
    ? "red"
    : status === "contested"
    ? "purple"
    : "yellow";
}

function FacultyContributionCard({ contribution }) {
  const c = contribution;
  const [remarks, setRemarks] = useState(c.remarks || []);
  const [composerOpen, setComposerOpen] = useState(false);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/contributions/${c.id}/remarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remark: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post remark.");
      setRemarks((prev) => [data, ...prev]);
      setText("");
      setComposerOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <Avatar src={c.avatar_url} name={c.github_username} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
              {c.github_username}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">{formatDate(c.created_at)}</p>
          </div>
        </div>
        <Badge variant={statusVariant(c.status)} className="uppercase font-bold shrink-0">
          {c.status === "approved" ? "verified" : c.status}
        </Badge>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant={CATEGORY_BADGE_MAP[c.category] || "default"}>{c.category}</Badge>
        <span className="text-xs text-[var(--color-text-muted)] font-medium">
          {Number(c.time_estimate).toFixed(1)} hrs
        </span>
      </div>

      <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">{c.description}</p>

      {remarks.length > 0 && (
        <div className="pt-2 border-t border-[var(--color-border)] space-y-2">
          <p className="label-mono">Remarks ({remarks.length})</p>
          {remarks.map((r) => (
            <div key={r.id} className="flex items-start gap-2.5">
              <Avatar src={r.avatar_url} name={r.faculty_name} size="sm" />
              <div className="min-w-0">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  <span className="font-semibold">{r.faculty_name}</span>{" "}
                  <span className="text-[var(--color-text-muted)] text-xs">{formatDate(r.created_at)}</span>
                </p>
                <p className="text-sm text-[var(--color-text-primary)] mt-0.5">{r.remark}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-danger)] bg-[var(--color-danger-light)] rounded px-4 py-3 border border-[var(--color-border)]">
          {error}
        </div>
      )}

      {composerOpen ? (
        <form onSubmit={handleSubmit} className="space-y-2 pt-2 border-t border-[var(--color-border)]">
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Leave a remark for this student…"
            rows={2}
            className="w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] rounded focus:outline-none focus:shadow-[3px_3px_0_0_var(--color-primary)]"
          />
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setComposerOpen(false);
                setText("");
              }}
              className="text-sm font-bold text-[var(--color-text-secondary)] px-3 py-1.5"
            >
              Cancel
            </button>
            <Button type="submit" size="sm" loading={submitting}>
              Post Remark
            </Button>
          </div>
        </form>
      ) : (
        <div className="pt-1">
          <Button type="button" size="sm" variant="secondary" onClick={() => setComposerOpen(true)}>
            Leave a Remark
          </Button>
        </div>
      )}
    </Card>
  );
}

export default function FacultyContributionList({ initialContributions }) {
  if (!initialContributions || initialContributions.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-[var(--color-text-muted)]">No contributions logged yet.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4 stagger-children">
      {initialContributions.map((c) => (
        <FacultyContributionCard key={c.id} contribution={c} />
      ))}
    </div>
  );
}
