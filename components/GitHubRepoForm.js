"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

export default function GitHubRepoForm({ initialRepo = "", isLeader = false }) {
  const [repo, setRepo] = useState(initialRepo);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const hasRepoLinked = !!initialRepo;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isLeader) return;

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save settings.");
      }

      setSuccess("Repository settings saved successfully!");
      // Clear success alert after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-3">
        <p className="font-mono text-xs uppercase tracking-wider text-[#55503f]">GitHub Integration</p>
        <span
          className="font-mono text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-[2px]"
          style={{
            backgroundColor: hasRepoLinked ? "#16a34a" : "#e8e5db",
            color: hasRepoLinked ? "#f4f2ec" : "#55503f",
          }}
        >
          {hasRepoLinked ? "Connected" : "Not linked"}
        </span>
      </div>

      <div className="rounded-[3px] border-2 border-[#0e0d0b] shadow-[4px_4px_0_0_rgba(26,63,214,0.5)] bg-[#0e0d0b] text-[#f4f2ec] p-6 space-y-4">
        <div>
          <p className="font-mono text-xs text-[#1a3fd6]">$ repository --owner/name</p>
          <p className="text-sm text-[#c9c5b8] mt-1.5">
            Link a GitHub repository to automatically pull commits as verifiable contributions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-[#ff6b6b] border border-[#ff6b6b] rounded-[3px] px-4 py-3 font-mono">
              ✕ {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-[#4ade80] border border-[#4ade80] rounded-[3px] px-4 py-3 font-mono">
              ✓ {success}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <label htmlFor="github-repo" className="font-mono text-[11px] uppercase tracking-wider text-[#928c78]">
                owner/name
              </label>
              <input
                id="github-repo"
                name="repo"
                type="text"
                disabled={!isLeader || saving}
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="e.g. torvalds/linux"
                className="w-full mt-1.5 rounded-[3px] border-2 border-[#2a2822] bg-[#181713] text-[#f4f2ec] placeholder-[#6b6860] px-3.5 py-2.5 font-mono text-sm focus:outline-none focus:border-[#1a3fd6] disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {isLeader && (
              <Button
                id="save-repo-settings"
                type="submit"
                variant="signal"
                loading={saving}
                className="w-full sm:w-auto shrink-0"
              >
                Save
              </Button>
            )}
          </div>

          {!isLeader && (
            <p className="font-mono text-xs text-[#928c78]">
              # only the project leader can change repository settings
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
