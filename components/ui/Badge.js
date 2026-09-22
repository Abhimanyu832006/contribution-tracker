/**
 * Badge component for category labels, roles, statuses.
 * Variants: default, indigo, green, yellow, red, blue
 */
export default function Badge({
  children,
  variant = "default",
  className = "",
}) {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";

  const variants = {
    default: "bg-slate-100 text-slate-600",
    indigo:  "bg-indigo-50 text-indigo-700",
    green:   "bg-green-50 text-green-700",
    yellow:  "bg-amber-50 text-amber-700",
    red:     "bg-red-50 text-red-700",
    blue:    "bg-blue-50 text-blue-700",
  };

  return (
    <span className={`${base} ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
}

export { CATEGORY_BADGE_MAP } from "@/lib/constants";
