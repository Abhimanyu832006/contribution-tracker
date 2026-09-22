/**
 * Card — a plain white block with a real border and a hard shadow-offset
 * (not a soft blur), so it feels like a physical card placed on the page
 * rather than a hovering SaaS panel. `accent` optionally paints a thick
 * top edge in one of the system colors (signal/work/verified/flagged/
 * pending) to tag what kind of thing the card represents.
 */
const ACCENTS = {
  signal: "#1a3fd6",
  work: "#ff4713",
  verified: "#16a34a",
  flagged: "#e11d2e",
  pending: "#eab308",
};

export default function Card({
  children,
  className = "",
  hover = false,
  accent,
  padding = "p-6",
  ...props
}) {
  const base = "bg-white rounded-[3px] border-2 border-[#0e0d0b]";
  const shadow = "shadow-[4px_4px_0_0_rgba(14,13,11,0.9)]";
  const hoverClass = hover
    ? "transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_rgba(14,13,11,0.9)]"
    : "";
  const accentStyle = accent
    ? { borderTop: `6px solid ${ACCENTS[accent] || accent}` }
    : undefined;

  return (
    <div
      className={`${base} ${shadow} ${hoverClass} ${padding} ${className}`}
      style={accentStyle}
      {...props}
    >
      {children}
    </div>
  );
}
