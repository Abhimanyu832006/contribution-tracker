"use client";

import { useState, useEffect, useCallback } from "react";
import Card from "@/components/ui/Card";
import ContributionForm from "@/components/ContributionForm";
import ContributionList from "@/components/ContributionList";

export default function LogPage() {
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchContributions = useCallback(async () => {
    try {
      const res = await fetch("/api/contributions");
      if (res.ok) {
        const data = await res.json();
        setContributions(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        const res = await fetch("/api/contributions");
        if (res.ok && !ignore) {
          const data = await res.json();
          setContributions(data);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    loadData();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Log Contribution
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Record what you worked on and how long it took
        </p>
      </div>

      {/* Form card */}
      <Card>
        <h2 className="text-base font-semibold text-gray-900 mb-5">
          New Entry
        </h2>
        <ContributionForm onSuccess={fetchContributions} />
      </Card>

      {/* Your recent contributions */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Your Recent Contributions
        </h2>
        {loading ? (
          <div className="py-12 text-center">
            <div className="w-6 h-6 mx-auto border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-400 mt-3">Loading…</p>
          </div>
        ) : (
          <ContributionList contributions={contributions} />
        )}
      </section>
    </div>
  );
}
