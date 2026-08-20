import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export const metadata = {
  title: "Scores & Reports — Contribution Tracker",
};

export default function ScoresPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Scores &amp; Reports</h1>
        <p className="text-sm text-gray-500 mt-1">
          Automated scoring and exportable reports for your project
        </p>
      </div>

      {/* Empty state */}
      <Card className="flex flex-col items-center justify-center py-20 text-center">
        {/* Illustration */}
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-5 shadow-sm">
          <svg
            className="w-8 h-8 text-indigo-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
            />
          </svg>
        </div>

        <Badge variant="yellow" className="mb-4">
          Coming soon
        </Badge>

        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Scoring &amp; PDF Export
        </h2>
        <p className="text-sm text-gray-500 max-w-xs">
          Automated contribution scoring and one-click PDF report generation are
          planned for a future sprint. Your data is already being collected —
          reports will work retroactively once this feature ships.
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg">
          {[
            {
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              ),
              label: "Contribution Scoring",
              desc: "Weighted scores per category",
            },
            {
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              ),
              label: "PDF Export",
              desc: "Formatted for professors",
            },
            {
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                </svg>
              ),
              label: "Equity Analysis",
              desc: "Fairness across team members",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 border border-gray-100"
            >
              <span className="text-gray-400">{item.icon}</span>
              <p className="text-xs font-semibold text-gray-700 text-center">
                {item.label}
              </p>
              <p className="text-xs text-gray-400 text-center">{item.desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
