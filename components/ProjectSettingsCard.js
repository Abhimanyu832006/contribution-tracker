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
        <div className="text-sm text-[#b3271e] border border-[#b3271e] px-4 py-3">
          {error}
        </div>
      )}

      {/* Project Overview */}
      <Card className="space-y-6">
        <p className="label-mono rule-b pb-2">PROJECT OVERVIEW</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="label-mono">PROJECT NAME</p>
            <p className="text-base font-medium mt-1">
              {project.name}
            </p>
          </div>

          <div>
            <p className="label-mono">YOUR ROLE</p>
            <div className="mt-1">
              <Badge variant={isLeader ? "indigo" : "default"}>
                {isLeader ? "Project Leader" : "Team Member"}
              </Badge>
            </div>
          </div>

          <div>
            <p className="label-mono">INVITE CODE</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="font-mono font-medium tracking-wider">
                {project.invite_code}
              </span>
              <button
                type="button"
                onClick={handleCopyInvite}
                className="label-mono hover:text-[#141311] hover:underline"
              >
                {copied ? "COPIED!" : "COPY"}
              </button>
            </div>
          </div>

          <div>
            <p className="label-mono">TEAM SIZE</p>
            <p className="text-sm font-medium mt-1">
              {memberCount} member{memberCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </Card>

      {/* Project Actions / Danger Zone */}
      {!isLeader && (
        <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">
              Leave Project
            </p>
            <p className="text-xs text-[#4a473f] mt-0.5">
              Remove yourself from this project. You can rejoin later using the invite code.
            </p>
          </div>
          <Button
            type="button"
            variant="danger"
            onClick={() => setLeaveModalOpen(true)}
          >
            Leave Project
          </Button>
        </Card>
      )}

      {isLeader && (
        <Card className="border-[#b3271e] space-y-4">
          <div>
            <p className="label-mono !text-[#b3271e]">DANGER ZONE</p>
            <p className="text-xs text-[#4a473f] mt-1.5">
              Permanently delete this project along with all logged contributions and team memberships. This action cannot be undone.
            </p>
          </div>
          <Button
            type="button"
            variant="danger"
            onClick={() => setDeleteModalOpen(true)}
          >
            Delete Project
          </Button>
        </Card>
      )}

      {/* Delete Project Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#141311]/50 p-4">
          <div className="w-full max-w-md rounded-none bg-[#faf9f5] border border-[#b3271e] p-6">
            <p className="label-mono !text-[#b3271e] mb-2">DELETE PROJECT</p>
            <h3 className="font-serif text-2xl">
              &quot;{project.name}&quot;?
            </h3>
            <p className="mt-2 text-sm text-[#4a473f]">
              This will permanently delete the project, all logged contributions, and remove all {memberCount} members.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={loading}
                className="font-mono uppercase tracking-wider text-xs px-4 py-2.5 text-[#4a473f] hover:text-[#141311]"
              >
                Cancel
              </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#141311]/50 p-4">
          <div className="w-full max-w-md rounded-none bg-[#faf9f5] border border-[#141311] p-6">
            <p className="label-mono mb-2">LEAVE PROJECT</p>
            <h3 className="font-serif text-2xl">
              &quot;{project.name}&quot;?
            </h3>
            <p className="mt-2 text-sm text-[#4a473f]">
              You will lose access to its dashboard and team views until you are re-invited.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setLeaveModalOpen(false)}
                disabled={loading}
                className="font-mono uppercase tracking-wider text-xs px-4 py-2.5 text-[#4a473f] hover:text-[#141311]"
              >
                Cancel
              </button>
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
