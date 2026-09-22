"use client";

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
    <div className="space-y-8">
      {/* Team summary — three solid color blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Team hours", value: teamTotalHours.toFixed(1), bg: "#0e0d0b", fg: "#f4f2ec" },
          { label: "Contributions", value: String(teamTotalContributions).padStart(3, "0"), bg: "#1a3fd6", fg: "#f4f2ec" },
          { label: "Contributors", value: String(members.length).padStart(2, "0"), bg: "#ff4713", fg: "#0e0d0b" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-[3px] border-2 border-[#0e0d0b] p-5"
            style={{ backgroundColor: s.bg, color: s.fg }}
          >
            <p className="stat-num text-4xl sm:text-5xl">{s.value}</p>
            <p className="font-mono text-xs uppercase tracking-wider mt-2 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Export action */}
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-wider text-[#55503f]">Per-member breakdown</p>
        <Button id="export-csv" variant="secondary" size="sm" onClick={handleExportCsv}>
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-[3px] border-2 border-[#0e0d0b]">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#0e0d0b] text-[#f4f2ec]">
              <th className="text-left font-mono text-xs uppercase tracking-wider px-4 py-3">Member</th>
              <th className="text-right font-mono text-xs uppercase tracking-wider px-4 py-3">Hours</th>
              <th className="text-right font-mono text-xs uppercase tracking-wider px-4 py-3">GitHub</th>
              <th className="text-right font-mono text-xs uppercase tracking-wider px-4 py-3">Manual</th>
              <th className="text-right font-mono text-xs uppercase tracking-wider px-4 py-3">Verified</th>
              <th className="text-right font-mono text-xs uppercase tracking-wider px-4 py-3">Pending</th>
              <th className="text-right font-mono text-xs uppercase tracking-wider px-4 py-3">Flagged</th>
              <th className="text-right font-mono text-xs uppercase tracking-wider px-4 py-3">% Hours</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const pct = teamTotalHours ? (m.total_hours / teamTotalHours) * 100 : 0;
              return (
                <tr key={m.id} className="border-t-2 border-[#0e0d0b] bg-white hover:bg-[#f4f2ec] transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={m.avatar_url} name={m.github_username} size="sm" />
                      <div>
                        <p className="font-semibold">{m.github_username}</p>
                        <Badge variant={m.role === "leader" ? "indigo" : "default"} className="mt-0.5">
                          {m.role === "leader" ? "Leader" : "Member"}
                        </Badge>
                      </div>
                    </div>
                  </td>
                  <td className="text-right px-4 py-3 font-mono font-semibold">
                    {Number(m.total_hours).toFixed(1)}
                  </td>
                  <td className="text-right px-4 py-3 font-mono text-[#1a3fd6]">{m.github_count}</td>
                  <td className="text-right px-4 py-3 font-mono text-[#ff4713]">{m.manual_count}</td>
                  <td className="text-right px-4 py-3 font-mono text-[#16a34a]">{m.verified_count}</td>
                  <td className="text-right px-4 py-3 font-mono text-[#a1750b]">{m.pending_count}</td>
                  <td className="text-right px-4 py-3 font-mono text-[#e11d2e]">{m.flagged_count}</td>
                  <td className="text-right px-4 py-3 font-mono text-[#928c78]">{pct.toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="font-mono text-[11px] text-[#928c78]">
        Figures computed directly from logged contributions — no weighting or scoring formula applied.
      </p>
    </div>
  );
}
