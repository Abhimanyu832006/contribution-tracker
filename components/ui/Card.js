/**
 * Card component — rounded container with subtle border and shadow.
 * Supports hover lift effect via `hover` prop.
 */
export default function Card({
  children,
  className = "",
  hover = false,
  padding = "p-6",
  ...props
}) {
  const base = "bg-white rounded-xl border border-gray-200/60 shadow-sm";
  const hoverClass = hover
    ? "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
    : "";

  return (
    <div className={`${base} ${hoverClass} ${padding} ${className}`} {...props}>
      {children}
    </div>
  );
}
