"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";

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
    <section className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          GitHub Integration
        </h2>
        {hasRepoLinked ? (
          <Badge variant="green">Connected</Badge>
        ) : (
          <Badge variant="default">Not Linked</Badge>
        )}
      </div>

      <Card accent="github" className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Repository</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Link your GitHub repository to automatically pull commits and pull requests as contributions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 border border-red-200 animate-scale-in">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-xl px-4 py-3 border border-emerald-200 animate-scale-in">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              {success}
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <Input
                label="GitHub Repository (owner/name)"
                id="github-repo"
                name="repo"
                type="text"
                disabled={!isLeader || saving}
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="e.g. torvalds/linux"
                className={!isLeader ? "bg-slate-50 text-slate-500 cursor-not-allowed" : ""}
              />
            </div>

            {isLeader && (
              <Button
                id="save-repo-settings"
                type="submit"
                loading={saving}
                className="w-full sm:w-auto shrink-0"
              >
                Save Repository
              </Button>
            )}
          </div>

          {!isLeader && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 flex items-center gap-2">
              <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a.75.75 0 00-.75.75v3.5a.75.75 0 001.5 0v-3.5A.75.75 0 0010 5z" clipRule="evenodd" />
              </svg>
              Only the project leader can change repository settings.
            </p>
          )}
        </form>
      </Card>
    </section>
  );
}
