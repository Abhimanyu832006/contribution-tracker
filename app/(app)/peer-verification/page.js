import { requireProject } from "@/lib/auth";
import pool from "@/lib/db";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";

export const metadata = {
  title: "Peer Verification — Contribution Tracker",
};

function timeAgo(iso) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const CATEGORY_BADGE_MAP = {
  Code: "indigo",
  Design: "purple",
  Documentation: "blue",
  Testing: "green",
  Research: "yellow",
  "Project Management": "orange",
  Meeting: "default",
  Other: "default",
};

export default async function PeerVerificationPage() {
  const session = await requireProject();
  const projectId = session.user.projectId;

  const { rows: contributions } = await pool.query(
    `SELECT
       c.id,
       c.category,
       c.description,
       c.time_estimate,
       c.status,
       c.source,
       c.created_at,
       u.github_username,
       u.avatar_url
     FROM contributions c
     JOIN users u ON u.id = c.user_id
     WHERE c.project_id = $1
     ORDER BY c.created_at DESC`,
    [projectId]
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page header */}
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Peer Verification
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Review your teammates&apos; contributions and flag anything that
              looks off
            </p>
          </div>
        </div>

        {/* Status notice */}
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <svg
            className="w-4 h-4 text-amber-600 mt-0.5 shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          <div className="min-w-0">
            <p className="text-sm font-medium text-amber-800">
              Approve / Flag actions are not yet wired
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              The buttons below are visible so you can see the intended UX.
              Verification logic is coming in a future sprint — clicking them
              does nothing for now.
            </p>
          </div>
          <Badge variant="yellow" className="shrink-0">
            Coming soon
          </Badge>
        </div>
      </div>

      {/* Contribution list with verify buttons */}
      <section className="space-y-3 stagger-children">
        {contributions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
            <div className="text-gray-300 mb-3">
              <svg
                className="w-12 h-12 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-400">No contributions to verify yet</p>
            <p className="text-xs text-gray-300 mt-1">
              Log some contributions first on the Contributions page
            </p>
          </div>
        ) : (
          contributions.map((c) => (
            <Card
              key={c.id}
              className="flex items-center gap-4"
              padding="px-5 py-4"
            >
              {/* Avatar */}
              <Avatar
                src={c.avatar_url}
                name={c.github_username}
                size="sm"
              />

              {/* Category badge */}
              <Badge variant={CATEGORY_BADGE_MAP[c.category] || "default"}>
                {c.category}
              </Badge>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {c.description}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {c.github_username} · {timeAgo(c.created_at)}
                </p>
              </div>

              {/* Hours */}
              <div className="text-right shrink-0 mr-4">
                <p className="text-sm font-semibold text-indigo-600">
                  {Number(c.time_estimate).toFixed(1)} hrs
                </p>
                <p className="text-xs text-gray-400 mt-0.5 capitalize">
                  {c.status || "pending"}
                </p>
              </div>

              {/* Verify actions — disabled, not yet functional */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  id={`approve-${c.id}`}
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled
                  title="Peer verification coming soon — this button is not yet functional"
                  className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                  Approve
                </Button>
                <Button
                  id={`flag-${c.id}`}
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled
                  title="Peer verification coming soon — this button is not yet functional"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5"
                    />
                  </svg>
                  Flag
                </Button>
              </div>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
