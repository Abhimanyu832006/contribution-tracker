"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";

export default function TeamMemberCard({
  member,
  isLeader = false,
  currentUserId,
}) {
  const router = useRouter();
  const [removing, setRemoving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");
  const { id, github_username, avatar_url, role, total_hours } = member;

  const canRemove = isLeader && id !== currentUserId && role !== "leader";

  async function handleRemove() {
    setError("");
    setRemoving(true);
    try {
      const res = await fetch("/api/projects/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      });

      if (res.ok) {
        setConfirmOpen(false);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to remove member.");
      }
    } catch (err) {
      console.error("Error removing member:", err);
      setError("Failed to remove member. Please try again.");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <>
      <Card hover className="flex items-center gap-4 group relative">
        <Avatar src={avatar_url} name={github_username} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
              {github_username}
            </p>
            <Badge variant={role === "leader" ? "indigo" : "default"}>
              {role === "leader" ? "Leader" : "Member"}
            </Badge>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            @{github_username}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right shrink-0">
            <p className="stat-num text-2xl" style={{ color: "var(--color-primary)" }}>
              {Number(total_hours || 0).toFixed(1)}
            </p>
            <p className="label-mono">hours</p>
          </div>

          {canRemove && (
            <button
              onClick={() => setConfirmOpen(true)}
              className="p-1.5 rounded border-2 border-transparent hover:border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-light)] transition-colors"
              title={`Remove ${github_username} from project`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          )}
        </div>
      </Card>

      {/* Confirmation Dialog */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded bg-[var(--color-surface)] p-6 brutal-shadow-lg border-2 border-[var(--color-border)] animate-scale-in">
            <h3 className="text-lg font-black uppercase tracking-tight text-[var(--color-text-primary)]">
              Remove Team Member?
            </h3>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Are you sure you want to remove{" "}
              <span className="font-bold text-[var(--color-text-primary)]">@{github_username}</span>{" "}
              from this project? Their logged contributions will remain in the project history.
            </p>
            {error && (
              <div className="mt-4 flex items-center gap-2 text-sm font-bold text-[var(--color-danger)] bg-[var(--color-danger-light)] rounded px-4 py-3 border-2 border-[var(--color-border)]">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={removing}
                className="rounded px-4 py-2 text-sm font-bold text-[var(--color-text-secondary)] border-2 border-transparent hover:border-[var(--color-border)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={removing}
                className="brutal-btn rounded bg-[var(--color-danger)] px-4 py-2 text-sm font-bold text-white disabled:opacity-50 flex items-center gap-1.5"
              >
                {removing ? "Removing…" : "Remove Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
