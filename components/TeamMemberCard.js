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
  const { id, github_username, avatar_url, role, total_hours } = member;

  const canRemove = isLeader && id !== currentUserId && role !== "leader";

  async function handleRemove() {
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
        alert(data.error || "Failed to remove member.");
      }
    } catch (err) {
      console.error("Error removing member:", err);
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
            <p className="text-sm font-semibold text-gray-900 truncate">
              {github_username}
            </p>
            <Badge variant={role === "leader" ? "indigo" : "default"}>
              {role === "leader" ? "Leader" : "Member"}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            @{github_username}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-indigo-600">
              {Number(total_hours || 0).toFixed(1)}
            </p>
            <p className="text-xs text-gray-500">hours</p>
          </div>

          {canRemove && (
            <button
              onClick={() => setConfirmOpen(true)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-gray-100 animate-scale-in">
            <h3 className="text-base font-semibold text-gray-900">
              Remove Team Member?
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to remove{" "}
              <span className="font-semibold text-gray-900">@{github_username}</span>{" "}
              from this project? Their logged contributions will remain in the project history.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={removing}
                className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRemove}
                disabled={removing}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1.5"
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
