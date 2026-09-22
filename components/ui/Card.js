/**
 * Card component — ruled container, sharp corners, no shadow.
 * Editorial system: a 1px border does the work a shadow used to.
 * Supports a subtle hover rule-darkening via `hover` prop.
 */
export default function Card({
  children,
  className = "",
  hover = false,
  padding = "p-6",
  ...props
}) {
  const base = "bg-[#faf7f0] rounded-none border border-[rgba(28,26,21,0.14)]";
  const hoverClass = hover
    ? "transition-colors duration-150 hover:border-[#1c1a15]"
    : "";

  return (
    <div className={`${base} ${hoverClass} ${padding} ${className}`} {...props}>
      {children}
    </div>
  );
}
