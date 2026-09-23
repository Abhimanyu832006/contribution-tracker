/**
 * Badge component for category labels, roles, statuses.
 * Neo-brutalist: flat saturated fill, thin black border, sharp corners.
 * Variants: default, indigo, green, yellow, red, blue
 */
export default function Badge({
  children,
  variant = "default",
  className = "",
}) {
  const base = "inline-flex items-center border border-[var(--color-border)] px-2 py-0.5 text-xs font-bold uppercase tracking-wide";

  const variants = {
    default: "bg-[var(--color-bg)] text-[var(--color-text-primary)]",
    indigo:  "bg-[var(--color-settings-light)] text-[var(--color-settings)]",
    green:   "bg-[var(--color-success-light)] text-[var(--color-success)]",
    yellow:  "bg-[var(--color-reports-light)] text-[#5a6b00]",
    red:     "bg-[var(--color-danger-light)] text-[var(--color-danger)]",
    blue:    "bg-[var(--color-contributions-light)] text-[var(--color-contributions)]",
  };

  return (
    <span className={`${base} ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
}

export { CATEGORY_BADGE_MAP } from "@/lib/constants";
