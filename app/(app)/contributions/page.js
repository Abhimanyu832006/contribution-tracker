"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Card from "@/components/ui/Card";
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

  const fetchContributions = useCallback(async () => {
    setLoading(true);
    try {
      const url =
        filter === "mine"
          ? "/api/contributions?mine=1"
          : "/api/contributions";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setContributions(data);
      }
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      try {
        const url =
          filter === "mine"
            ? "/api/contributions?mine=1"
            : "/api/contributions";
        const res = await fetch(url);
        if (res.ok && !ignore) {
          const data = await res.json();
          setContributions(data);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
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
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 rule-strong-b pb-5">
        <div>
          <p className="label-mono mb-2">CONTRIBUTIONS</p>
          <h1 className="font-serif text-4xl sm:text-5xl leading-none">Contributions</h1>
        </div>
        {activeProject?.repoOwner && activeProject?.repoName && (
          <Button
            id="sync-github-commits"
            onClick={handleSync}
            loading={syncing}
            variant="secondary"
            size="sm"
          >
            ⟲ Sync GitHub
          </Button>
        )}
      </div>

      {syncError && (
        <div className="text-sm text-[#9c1f1f] border border-[#9c1f1f] px-4 py-3">
          {syncError}
        </div>
      )}

      {syncResult && (
        <div className="flex items-center justify-between gap-3 text-sm border border-[#2f5c3f] text-[#2f5c3f] px-4 py-3">
          <span className="font-mono">
            SYNC COMPLETE — {syncResult.added} added / {syncResult.skipped} skipped / {syncResult.unmatched} unmatched
          </span>
          <button
            onClick={() => setSyncResult(null)}
            className="label-mono hover:underline shrink-0"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Log new contribution — only shown on "Mine" tab */}
      {filter === "mine" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between rule-b pb-2">
            <p className="label-mono">LOG NEW CONTRIBUTION</p>
            <button
              type="button"
              onClick={() => setShowForm((p) => !p)}
              className="label-mono hover:underline"
            >
              {showForm ? "HIDE" : "SHOW"}
            </button>
          </div>

          {showForm && (
            <Card>
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
        <div className="flex items-baseline gap-6 rule-b pb-2">
          <button
            type="button"
            onClick={() => setFilter("mine")}
            className={`label-mono !text-xs pb-1 ${
              filter === "mine"
                ? "text-[#1c1a15] border-b-2 border-[#a4451f] -mb-[9px]"
                : "hover:text-[#1c1a15]"
            }`}
          >
            MINE
          </button>
          <button
            type="button"
            onClick={() => setFilter("everyone")}
            className={`label-mono !text-xs pb-1 ${
              filter === "everyone"
                ? "text-[#1c1a15] border-b-2 border-[#a4451f] -mb-[9px]"
                : "hover:text-[#1c1a15]"
            }`}
          >
            EVERYONE&apos;S
          </button>
          {!loading && (
            <span className="label-mono ml-auto">
              {filteredContributions.length}
              {filteredContributions.length !== contributions.length
                ? ` / ${contributions.length}`
                : ""}{" "}
              ENTRIES
            </span>
          )}
        </div>

        {/* Search + filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search description or contributor…"
            className="flex-1 rounded-none border border-[rgba(28,26,21,0.2)] bg-[#faf7f0] px-3.5 py-2.5 text-sm text-[#1c1a15] placeholder-[#96907a] transition-colors duration-150 focus:outline-none focus:border-[#1c1a15]"
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
            <div className="w-4 h-4 mx-auto border-2 border-[#1c1a15] border-t-transparent animate-spin" />
            <p className="label-mono mt-3">LOADING…</p>
          </div>
        ) : (
          <ContributionList contributions={filteredContributions} />
        )}
      </div>
    </div>
  );
}
