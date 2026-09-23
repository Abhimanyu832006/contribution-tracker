"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

export default function ProjectSettingsCard({ project, role, memberCount }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isLeader = role === "leader";

  async function handleCopyInvite() {
    try {
      await navigator.clipboard.writeText(project.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleDeleteProject() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete project.");
      }

      const data = await res.json();
      setDeleteModalOpen(false);

      if (data.remainingProjects > 0) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLeaveProject() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/projects/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to leave project.");
      }

      const data = await res.json();
      setLeaveModalOpen(false);

      if (data.remainingProjects > 0) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-danger)] bg-[var(--color-danger-light)] rounded px-4 py-3 border-2 border-[var(--color-border)]">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Project Overview */}
      <Card className="space-y-6" style={{ borderLeft: "6px solid var(--color-settings)" }}>
        <div>
          <h2 className="text-lg font-black uppercase tracking-tight text-[var(--color-text-primary)]">
            Project Overview
          </h2>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            General information about your current active workspace
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t-2 border-[var(--color-border)]">
          <div>
            <p className="label-mono">Project Name</p>
            <p className="text-base font-bold text-[var(--color-text-primary)] mt-1">
              {project.name}
            </p>
          </div>

          <div>
            <p className="label-mono">Your Role</p>
            <div className="mt-1">
              <Badge variant={isLeader ? "indigo" : "default"}>
                {isLeader ? "Project Leader" : "Team Member"}
              </Badge>
            </div>
          </div>

          <div>
            <p className="label-mono">Invite Code</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="font-mono font-bold text-[var(--color-text-primary)] tracking-wider bg-[var(--color-bg)] border-2 border-[var(--color-border)] px-2 py-0.5 rounded">
                {project.invite_code}
              </span>
              <button
                type="button"
                onClick={handleCopyInvite}
                className="text-xs font-bold uppercase text-[var(--color-primary)] hover:underline transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          <div>
            <p className="label-mono">Team Size</p>
            <p className="stat-num text-2xl text-[var(--color-text-primary)] mt-1">
              {memberCount}
            </p>
          </div>
        </div>
      </Card>

      {/* Project Actions / Danger Zone */}
      {!isLeader && (
        <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black uppercase tracking-tight text-[var(--color-text-primary)]">
              Leave Project
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Remove yourself from this project. You can rejoin later using the invite code.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setLeaveModalOpen(true)}
            className="!text-[var(--color-danger)]"
          >
            Leave Project
          </Button>
        </Card>
      )}

      {isLeader && (
        <Card accent="danger" className="bg-[var(--color-danger-light)] space-y-4">
          <div>
            <h3 className="text-sm font-black uppercase tracking-tight text-[var(--color-danger)]">
              Danger Zone
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Permanently delete this project along with all logged contributions and team memberships. This action cannot be undone.
            </p>
          </div>
          <div className="pt-2">
            <Button
              type="button"
              variant="danger"
              onClick={() => setDeleteModalOpen(true)}
            >
              Delete Project
            </Button>
          </div>
        </Card>
      )}

      {/* Delete Project Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded bg-[var(--color-surface)] p-6 brutal-shadow-lg border-2 border-[var(--color-border)] animate-scale-in">
            <div className="w-12 h-12 rounded border-2 border-[var(--color-border)] bg-[var(--color-danger-light)] text-[var(--color-danger)] flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
              Delete &quot;{project.name}&quot;?
            </h3>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              This will permanently delete the project, all logged contributions, and remove all {memberCount} members.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setDeleteModalOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleDeleteProject}
                loading={loading}
              >
                Delete Permanently
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Project Confirmation Modal */}
      {leaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded bg-[var(--color-surface)] p-6 brutal-shadow-lg border-2 border-[var(--color-border)] animate-scale-in">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
              Leave &quot;{project.name}&quot;?
            </h3>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Are you sure you want to leave this project? You will lose access to its dashboard and team views until you are re-invited.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setLeaveModalOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleLeaveProject}
                loading={loading}
              >
                Leave Project
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
