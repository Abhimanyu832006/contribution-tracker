"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";

export default function FacultyLeaveButton({ projectId, projectName }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLeave() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/projects/faculty-leave", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to stop supervising this project.");
      }

      setConfirmOpen(false);
      router.push("/faculty");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button type="button" variant="secondary" size="sm" className="!text-[var(--color-danger)]" onClick={() => setConfirmOpen(true)}>
        Stop Supervising
      </Button>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded bg-[var(--color-surface)] p-6 brutal-shadow-lg border border-[var(--color-border)] animate-scale-in">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
              Stop supervising &quot;{projectName}&quot;?
            </h3>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              You&apos;ll lose access to this project&apos;s reports and remarks until a leader
              invites you again with a new faculty invite code.
            </p>
            {error && (
              <div className="mt-4 flex items-center gap-2 text-sm font-bold text-[var(--color-danger)] bg-[var(--color-danger-light)] rounded px-4 py-3 border border-[var(--color-border)]">
                {error}
              </div>
            )}
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setConfirmOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="button" variant="danger" onClick={handleLeave} loading={loading}>
                Stop Supervising
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
