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
      {/* Team summary — large numerals, vertical rules, no cards */}
      <div className="grid grid-cols-3">
        {[
          { label: "TEAM HOURS", value: teamTotalHours.toFixed(1) },
          { label: "CONTRIBUTIONS", value: String(teamTotalContributions).padStart(3, "0") },
          { label: "CONTRIBUTORS", value: String(members.length).padStart(2, "0") },
        ].map((s, i) => (
          <div key={s.label} className={`py-4 rule-t ${i > 0 ? "border-l border-[rgba(28,26,21,0.14)] pl-6" : ""}`}>
            <p className="stat-num text-4xl sm:text-5xl">{s.value}</p>
            <p className="label-mono mt-2">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Export action */}
      <div className="flex items-center justify-between rule-b pb-2">
        <p className="label-mono">PER-MEMBER BREAKDOWN</p>
        <Button id="export-csv" variant="secondary" size="sm" onClick={handleExportCsv}>
          Export CSV
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="rule-strong-b">
              <th className="text-left label-mono px-0 py-2">Member</th>
              <th className="text-right label-mono px-4 py-2">Hours</th>
              <th className="text-right label-mono px-4 py-2">GitHub</th>
              <th className="text-right label-mono px-4 py-2">Manual</th>
              <th className="text-right label-mono px-4 py-2">Verified</th>
              <th className="text-right label-mono px-4 py-2">Pending</th>
              <th className="text-right label-mono px-4 py-2">Flagged</th>
              <th className="text-right label-mono px-0 py-2">% of Hours</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const pct = teamTotalHours ? (m.total_hours / teamTotalHours) * 100 : 0;
              return (
                <tr key={m.id} className="border-b border-[rgba(28,26,21,0.14)] hover:bg-[#faf7f0] transition-colors">
                  <td className="py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={m.avatar_url} name={m.github_username} size="sm" />
                      <div>
                        <p className="font-medium">{m.github_username}</p>
                        <Badge variant={m.role === "leader" ? "indigo" : "default"} className="mt-0.5">
                          {m.role === "leader" ? "Leader" : "Member"}
                        </Badge>
                      </div>
                    </div>
                  </td>
                  <td className="text-right px-4 py-3 font-mono font-medium">
                    {Number(m.total_hours).toFixed(1)}
                  </td>
                  <td className="text-right px-4 py-3 font-mono text-[#55503f]">{m.github_count}</td>
                  <td className="text-right px-4 py-3 font-mono text-[#55503f]">{m.manual_count}</td>
                  <td className="text-right px-4 py-3 font-mono text-[#2f5c3f]">{m.verified_count}</td>
                  <td className="text-right px-4 py-3 font-mono text-[#8a6a1f]">{m.pending_count}</td>
                  <td className="text-right px-4 py-3 font-mono text-[#9c1f1f]">{m.flagged_count}</td>
                  <td className="text-right py-3 font-mono text-[#96907a]">{pct.toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="label-mono">
        FIGURES COMPUTED DIRECTLY FROM LOGGED CONTRIBUTIONS — NO WEIGHTING OR SCORING FORMULA APPLIED
      </p>
    </div>
  );
}
