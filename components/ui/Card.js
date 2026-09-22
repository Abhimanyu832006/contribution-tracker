/**
 * Card component — rounded container with subtle border and shadow.
 * Supports hover lift effect via `hover` prop, and an optional colored
 * left accent bar via `accent` (github | manual | success | warning | danger).
 */
const ACCENTS = {
  github: "#2563eb",
  manual: "#d97706",
  success: "#16a34a",
  warning: "#d97706",
  danger: "#dc2626",
};

export default function Card({
  children,
  className = "",
  hover = false,
  accent,
  padding = "p-6",
  ...props
}) {
  const base = "bg-white rounded-xl border border-slate-200 shadow-sm";
  const hoverClass = hover
    ? "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
    : "";
  const accentStyle = accent
    ? { borderLeft: `3px solid ${ACCENTS[accent] || accent}` }
    : undefined;

  return (
    <div
      className={`${base} ${hoverClass} ${padding} ${className}`}
      style={accentStyle}
      {...props}
    >
      {children}
    </div>
  );
}
