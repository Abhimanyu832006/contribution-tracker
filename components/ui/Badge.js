/**
 * Badge — a quiet tag. Category badges deliberately carry no color; the
 * logbook's two real color axes are SOURCE and VERIFICATION, applied
 * directly where those appear rather than through this component.
 * "indigo" here means "role emphasis" (e.g. project leader) — a human
 * distinction, so it takes the human/terracotta ink.
 */
export default function Badge({
  children,
  variant = "default",
  className = "",
}) {
  const base =
    "inline-flex items-center font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 border-b-2 rounded-none";

  const variants = {
    default: "text-[#55503f] border-[#96907a]",
    indigo:  "text-[#a4451f] border-[#a4451f]",
    green:   "text-[#2f5c3f] border-[#2f5c3f]",
    yellow:  "text-[#8a6a1f] border-[#8a6a1f]",
    red:     "text-[#9c1f1f] border-[#9c1f1f]",
  };

  return (
    <span className={`${base} ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
}

export { CATEGORY_BADGE_MAP } from "@/lib/constants";
