"use client";

import { useState, useEffect, useMemo } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import ContributionForm from "@/components/ContributionForm";
import ContributionList from "@/components/ContributionList";
import { CATEGORY_NAMES } from "@/lib/constants";

export default function ContributionsPage() {
  const [filter, setFilter] = useState("mine"); // "mine" | "everyone"
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(true);
  const [activeProject, setActiveProject] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [syncError, setSyncError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState(""); // "" | "github" | "manual"

  useEffect(() => {
    async function loadActiveProject() {
      try {
        const res = await fetch("/api/projects/active");
        if (res.ok) {
          const data = await res.json();
          setActiveProject(data.activeProject);
        }
      } catch (err) {
        console.error("Failed to load active project:", err);
      }
    }
    loadActiveProject();
  }, []);

  async function fetchContributions(signal) {
    setLoading(true);
    try {
      const url =
        filter === "mine"
          ? "/api/contributions?mine=1"
          : "/api/contributions";
      const res = await fetch(url, { signal });
      if (res.ok) {
        const data = await res.json();
        setContributions(data);
      }
    } catch {
      // Aborted requests (filter changed / unmount) are expected and ignored.
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setSyncError("");
    setSyncResult(null);
    try {
      const res = await fetch("/api/projects/sync-github", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to sync GitHub commits.");
      }
      setSyncResult(data);
      // Reload contributions
      fetchContributions();
    } catch (err) {
      setSyncError(err.message);
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    // Standard fetch-on-mount/filter-change pattern; setLoading(true) inside
    // fetchContributions is intentional and cancellation-safe via AbortController.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchContributions(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const filteredContributions = useMemo(() => {
    return contributions.filter((c) => {
      if (categoryFilter && c.category !== categoryFilter) return false;
      if (sourceFilter && c.source !== sourceFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const haystack = `${c.description || ""} ${c.github_username || ""} ${c.category || ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [contributions, categoryFilter, sourceFilter, search]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--color-text-primary)]">Contributions</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Log your work and browse everything the team has recorded
          </p>
        </div>
        {activeProject?.repoOwner && activeProject?.repoName && (
          <Button
            id="sync-github-commits"
            onClick={handleSync}
            loading={syncing}
            variant="secondary"
            size="sm"
          >
            <svg
              className="w-4 h-4 text-[var(--color-text-muted)] mr-1.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
            Sync GitHub
          </Button>
        )}
      </div>

      {syncError && (
        <div className="flex items-center gap-2 text-sm text-[var(--color-danger)] bg-[var(--color-danger-light)] rounded px-4 py-3 border border-[var(--color-border)] animate-scale-in">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          {syncError}
        </div>
      )}

      {syncResult && (
        <div className="flex items-center justify-between gap-3 text-sm text-[var(--color-success)] font-bold bg-[var(--color-success-light)] rounded px-4 py-3 border border-[var(--color-border)] animate-scale-in">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            <span>
              Sync complete: <strong>{syncResult.added}</strong> new commits added,{" "}
              <strong>{syncResult.skipped}</strong> skipped (already synced), and{" "}
              <strong>{syncResult.unmatched}</strong> unmatched (not by team members).
            </span>
          </div>
          <button
            onClick={() => setSyncResult(null)}
            className="text-xs font-bold uppercase text-[var(--color-success)] hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Log new contribution — only shown on "Mine" tab */}
      {filter === "mine" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="label-mono">
              Log New Contribution
            </h2>
            <button
              type="button"
              onClick={() => setShowForm((p) => !p)}
              className="text-xs font-medium text-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
            >
              {showForm ? "Hide form" : "Show form"}
            </button>
          </div>

          {showForm && (
            <Card accent="manual">
              <ContributionForm
                onSuccess={() => {
                  fetchContributions();
                }}
              />
            </Card>
          )}
        </div>
      )}

      {/* Filter toggle */}
      <div className="space-y-4">
        <div className="flex items-center gap-1 p-1 bg-[var(--color-bg)] rounded w-fit">
          <button
            type="button"
            onClick={() => setFilter("mine")}
            className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              filter === "mine"
                ? "bg-[var(--color-primary)] text-white brutal-shadow-sm"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            }`}
          >
            Mine
          </button>
          <button
            type="button"
            onClick={() => setFilter("everyone")}
            className={`px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              filter === "everyone"
                ? "bg-[var(--color-primary)] text-white brutal-shadow-sm"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            }`}
          >
            Everyone&apos;s
          </button>
        </div>

        <div className="flex items-center gap-3">
          <h2 className="label-mono">
            {filter === "mine" ? "Your Contributions" : "All Team Contributions"}
          </h2>
          {!loading && (
            <Badge variant="default">
              {filteredContributions.length}
              {filteredContributions.length !== contributions.length
                ? ` of ${contributions.length}`
                : ""}{" "}
              entries
            </Badge>
          )}
        </div>

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search description or contributor…"
            className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] transition-shadow duration-150 focus:outline-none focus:shadow-[3px_3px_0_0_var(--color-primary)]"
          />
          <Select
            id="category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="sm:w-48"
          >
            <option value="">All categories</option>
            {CATEGORY_NAMES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select
            id="source-filter"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="sm:w-40"
          >
            <option value="">All sources</option>
            <option value="github">GitHub</option>
            <option value="manual">Manual</option>
          </Select>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="w-6 h-6 mx-auto border border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[var(--color-text-muted)] mt-3">Loading…</p>
          </div>
        ) : (
          <ContributionList contributions={filteredContributions} />
        )}
      </div>
    </div>
  );
}
