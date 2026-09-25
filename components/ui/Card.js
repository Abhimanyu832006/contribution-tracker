/**
 * Card component — neo-brutalist container: thick black border, hard
 * offset shadow, no blur. Supports hover lift via `hover` prop, and an
 * optional colored left accent bar via `accent` (github | manual | success | warning | danger).
 */
const ACCENTS = {
  github: "var(--color-github)",
  manual: "var(--color-manual)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  danger: "var(--color-danger)",
  docs: "var(--color-contributions)",
};

export default function Card({
  children,
  className = "",
  hover = false,
  accent,
  padding = "p-6",
  ...props
}) {
  const base = "brutal-card";
  const hoverClass = hover ? "brutal-tile" : "";
  const accentStyle = accent
    ? { borderLeft: `6px solid ${ACCENTS[accent] || accent}` }
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
