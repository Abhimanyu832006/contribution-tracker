"use client";

import { useState, useEffect, useCallback } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import ContributionForm from "@/components/ContributionForm";
import ContributionList from "@/components/ContributionList";

export default function ContributionsPage() {
  const [filter, setFilter] = useState("mine"); // "mine" | "everyone"
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(true);

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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Contributions</h1>
        <p className="text-sm text-gray-500 mt-1">
          Log your work and browse everything the team has recorded
        </p>
      </div>

      {/* Log new contribution — only shown on "Mine" tab */}
      {filter === "mine" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Log New Contribution
            </h2>
            <button
              type="button"
              onClick={() => setShowForm((p) => !p)}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              {showForm ? "Hide form" : "Show form"}
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
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setFilter("mine")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === "mine"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Mine
          </button>
          <button
            type="button"
            onClick={() => setFilter("everyone")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === "everyone"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Everyone&apos;s
          </button>
        </div>

        <div className="flex items-center gap-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {filter === "mine" ? "Your Contributions" : "All Team Contributions"}
          </h2>
          {!loading && (
            <Badge variant="default">{contributions.length} entries</Badge>
          )}
          {filter === "everyone" && (
            <Badge variant="indigo">GitHub sync coming soon</Badge>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="w-6 h-6 mx-auto border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400 mt-3">Loading…</p>
          </div>
        ) : (
          <ContributionList contributions={contributions} />
        )}
      </div>
    </div>
  );
}
