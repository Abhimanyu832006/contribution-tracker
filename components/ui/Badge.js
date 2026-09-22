/**
 * Badge — a small solid chip. Category still carries no color (that
 * meaning is spent on SOURCE and VERIFICATION instead) but now reads as
 * an actual black-outlined chip rather than a whisper-thin underline.
 * "indigo" = role emphasis (project leader), painted in work-orange.
 */
export default function Badge({
  children,
  variant = "default",
  className = "",
}) {
  const base =
    "inline-flex items-center font-mono text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-[2px] border";

  const variants = {
    default: "text-[#0e0d0b] border-[#0e0d0b] bg-transparent",
    indigo:  "text-[#f4f2ec] border-[#ff4713] bg-[#ff4713]",
    green:   "text-[#f4f2ec] border-[#16a34a] bg-[#16a34a]",
    yellow:  "text-[#0e0d0b] border-[#eab308] bg-[#eab308]",
    red:     "text-[#f4f2ec] border-[#e11d2e] bg-[#e11d2e]",
  };

  return (
    <span className={`${base} ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
}

export { CATEGORY_BADGE_MAP } from "@/lib/constants";
