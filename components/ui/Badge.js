/**
 * Badge component for category labels, roles, statuses.
 * Variants: default, indigo, green, yellow, orange, red, purple
 *
 * Editorial system: monospace label with a bottom rule in the variant's
 * ink color, instead of a colored pill background — restrained, technical.
 */
export default function Badge({
  children,
  variant = "default",
  className = "",
}) {
  const base =
    "inline-flex items-center font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 border-b-2 rounded-none";

  const variants = {
    default: "text-[#4a473f] border-[#8a8578]",
    indigo:  "text-[#141311] border-[#ff4b12]",
    green:   "text-[#2c4a2e] border-[#2c4a2e]",
    yellow:  "text-[#7a5c00] border-[#7a5c00]",
    orange:  "text-[#c23600] border-[#ff4b12]",
    red:     "text-[#b3271e] border-[#b3271e]",
    purple:  "text-[#141311] border-[#4a473f]",
    blue:    "text-[#141311] border-[#4a473f]",
  };

  return (
    <span className={`${base} ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
}

export { CATEGORY_BADGE_MAP } from "@/lib/constants";
