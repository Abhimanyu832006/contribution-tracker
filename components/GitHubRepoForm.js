"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
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
    <section className="space-y-4">
      <div className="flex items-baseline gap-3 rule-b pb-2">
        <p className="label-mono">GITHUB INTEGRATION</p>
        <span
          className="stamp"
          style={{ color: hasRepoLinked ? "#2c4a2e" : "#8a8578" }}
        >
          {hasRepoLinked ? "CONNECTED" : "NOT LINKED"}
        </span>
      </div>

      <Card className="space-y-4 bg-[#141311] text-[#f3f1ea] border-[#141311]">
        <div>
          <p className="font-mono text-xs text-[#8a8578]">$ repository —owner/name</p>
          <p className="text-sm text-[#c9c6ba] mt-1">
            Link a GitHub repository to automatically pull commits as verifiable contributions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-[#ff8066] border border-[#ff8066] px-4 py-3 font-mono">
              ✕ {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-[#7fd88f] border border-[#7fd88f] px-4 py-3 font-mono">
              ✓ {success}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <label htmlFor="github-repo" className="font-mono text-[11px] uppercase tracking-wider text-[#8a8578]">
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
                className="w-full mt-1.5 rounded-none border border-[#3a3833] bg-[#1c1b18] text-[#f3f1ea] placeholder-[#6b6860] px-3.5 py-2.5 font-mono text-sm focus:outline-none focus:border-[#ff4b12] disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {isLeader && (
              <Button
                id="save-repo-settings"
                type="submit"
                loading={saving}
                className="w-full sm:w-auto shrink-0 !bg-[#ff4b12] !border-[#ff4b12] !text-[#141311] hover:!bg-[#f3f1ea] hover:!border-[#f3f1ea]"
              >
                Save
              </Button>
            )}
          </div>

          {!isLeader && (
            <p className="font-mono text-xs text-[#8a8578]">
              # only the project leader can change repository settings
            </p>
          )}
        </form>
      </Card>
    </section>
  );
}
