import Badge, { CATEGORY_BADGE_MAP } from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function timeAgo(iso) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

export default function ContributionList({ contributions = [] }) {
  if (contributions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center animate-fade-in">
        <div className="text-gray-300 mb-3">
          <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <p className="text-sm text-gray-400">No contributions yet</p>
        <p className="text-xs text-gray-300 mt-1">Log your first one to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 stagger-children">
      {contributions.map((c) => {
        const isGithub = c.source === "github";
        const Wrapper = isGithub && c.commit_url ? "a" : "div";
        const wrapperProps = isGithub && c.commit_url
          ? { href: c.commit_url, target: "_blank", rel: "noopener noreferrer" }
          : {};

        return (
          <Wrapper
            key={c.id}
            {...wrapperProps}
            className={`bg-white rounded-xl border border-gray-200/60 shadow-sm px-5 py-4 flex items-center gap-4 transition-all duration-200 hover:shadow-md hover:-translate-y-px ${
              isGithub ? "hover:border-indigo-300" : ""
            }`}
          >
            {/* Avatar */}
            <Avatar
              src={c.avatar_url}
              name={c.github_username || c.user_name}
              size="sm"
            />

            {/* Category badge */}
            <Badge variant={CATEGORY_BADGE_MAP[c.category] || "default"}>
              {c.category}
            </Badge>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate flex items-center gap-2">
                {c.description}
                {isGithub && (
                  <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                )}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-gray-500">
                  {c.github_username || c.user_name}
                </p>
                <Badge variant={isGithub ? "indigo" : "default"} className="!text-[10px] !px-1.5 !py-0">
                  {isGithub ? "GitHub" : "Manual"}
                </Badge>
              </div>
            </div>

            {/* Hours + time */}
            <div className="text-right shrink-0">
              {!isGithub && (
                <p className="text-sm font-semibold text-indigo-600">
                  {Number(c.time_estimate).toFixed(1)} hrs
                </p>
              )}
              <p className="text-xs text-gray-400 mt-0.5">
                {timeAgo(c.created_at)}
              </p>
            </div>
          </Wrapper>
        );
      })}
    </div>
  );
}
