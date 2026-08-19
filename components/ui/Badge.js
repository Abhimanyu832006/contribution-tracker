/**
 * Badge component for category labels, roles, statuses.
 * Variants: default, indigo, green, yellow, orange, red, purple
 */
export default function Badge({
  children,
  variant = "default",
  className = "",
}) {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";

  const variants = {
    default: "bg-gray-100 text-gray-700",
    indigo:  "bg-indigo-50 text-indigo-700",
    green:   "bg-emerald-50 text-emerald-700",
    yellow:  "bg-amber-50 text-amber-700",
    orange:  "bg-orange-50 text-orange-700",
    red:     "bg-red-50 text-red-700",
    purple:  "bg-purple-50 text-purple-700",
    blue:    "bg-blue-50 text-blue-700",
  };

  return (
    <span className={`${base} ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
}

/** Map contribution categories to badge variants */
export const CATEGORY_BADGE_MAP = {
  Research:      "blue",
  Design:        "purple",
  Documentation: "yellow",
  Testing:       "green",
  Meeting:       "orange",
  Other:         "default",
};
