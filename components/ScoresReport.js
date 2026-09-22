"use client";

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";

function csvEscape(value) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default function ScoresReport({
  members,
  projectName,
  teamTotalHours,
  teamTotalContributions,
}) {
  function handleExportCsv() {
    const headers = [
      "GitHub Username",
      "Role",
      "Total Hours",
      "Total Contributions",
      "GitHub Contributions",
      "Manual Contributions",
      "Pending",
      "Verified",
      "Flagged",
      "% of Team Hours",
    ];

    const rows = members.map((m) => {
      const pct = teamTotalHours ? ((m.total_hours / teamTotalHours) * 100).toFixed(1) : "0.0";
      return [
        m.github_username,
        m.role,
        Number(m.total_hours).toFixed(1),
        m.contribution_count,
        m.github_count,
        m.manual_count,
        m.pending_count,
        m.verified_count,
        m.flagged_count,
        `${pct}%`,
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = projectName.replace(/[^a-zA-Z0-9_-]/g, "_");
    a.download = `${safeName}_contribution_report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Team summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Team Total Hours
          </p>
          <p className="text-3xl font-bold text-indigo-600 mt-2">
            {teamTotalHours.toFixed(1)}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Total Contributions
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{teamTotalContributions}</p>
        </Card>
        <Card>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Contributors
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{members.length}</p>
        </Card>
      </div>

      {/* Export action */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Per-Member Breakdown
        </h2>
        <Button id="export-csv" variant="secondary" size="sm" onClick={handleExportCsv}>
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <Card padding="p-0" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left font-semibold text-gray-500 text-xs uppercase tracking-wider px-5 py-3">
                  Member
                </th>
                <th className="text-right font-semibold text-gray-500 text-xs uppercase tracking-wider px-4 py-3">
                  Hours
                </th>
                <th className="text-right font-semibold text-gray-500 text-xs uppercase tracking-wider px-4 py-3">
                  GitHub
                </th>
                <th className="text-right font-semibold text-gray-500 text-xs uppercase tracking-wider px-4 py-3">
                  Manual
                </th>
                <th className="text-right font-semibold text-gray-500 text-xs uppercase tracking-wider px-4 py-3">
                  Verified
                </th>
                <th className="text-right font-semibold text-gray-500 text-xs uppercase tracking-wider px-4 py-3">
                  Pending
                </th>
                <th className="text-right font-semibold text-gray-500 text-xs uppercase tracking-wider px-4 py-3">
                  Flagged
                </th>
                <th className="text-right font-semibold text-gray-500 text-xs uppercase tracking-wider px-5 py-3">
                  % of Hours
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((m) => {
                const pct = teamTotalHours ? (m.total_hours / teamTotalHours) * 100 : 0;
                return (
                  <tr key={m.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar src={m.avatar_url} name={m.github_username} size="sm" />
                        <div>
                          <p className="font-medium text-gray-900">{m.github_username}</p>
                          <Badge variant={m.role === "leader" ? "indigo" : "default"} className="!text-[10px] mt-0.5">
                            {m.role === "leader" ? "Leader" : "Member"}
                          </Badge>
                        </div>
                      </div>
                    </td>
                    <td className="text-right px-4 py-3 font-semibold text-gray-900">
                      {Number(m.total_hours).toFixed(1)}
                    </td>
                    <td className="text-right px-4 py-3 text-gray-600">{m.github_count}</td>
                    <td className="text-right px-4 py-3 text-gray-600">{m.manual_count}</td>
                    <td className="text-right px-4 py-3 text-emerald-600 font-medium">{m.verified_count}</td>
                    <td className="text-right px-4 py-3 text-amber-600 font-medium">{m.pending_count}</td>
                    <td className="text-right px-4 py-3 text-red-600 font-medium">{m.flagged_count}</td>
                    <td className="text-right px-5 py-3 text-gray-500">{pct.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="text-xs text-gray-400">
        Figures are computed directly from logged contributions and peer verification votes.
        No weighting or scoring formula is applied.
      </p>
    </div>
  );
}
