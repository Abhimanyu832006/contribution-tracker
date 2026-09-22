/**
 * Button component with variant support.
 * Variants: primary (default), secondary, ghost, danger
 * Sizes: sm, md (default), lg
 *
 * Editorial system: sharp corners, ink/paper/accent — no rounded pill buttons.
 */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center font-mono uppercase tracking-wider rounded-none border transition-colors duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:ring-[#141311] disabled:opacity-40 disabled:pointer-events-none";

  const variants = {
    primary:
      "bg-[#141311] text-[#f3f1ea] border-[#141311] hover:bg-[#ff4b12] hover:border-[#ff4b12]",
    secondary:
      "bg-transparent text-[#141311] border-[#141311] hover:bg-[#141311] hover:text-[#f3f1ea]",
    ghost:
      "bg-transparent text-[#4a473f] border-transparent hover:text-[#141311] hover:border-[#141311]",
    danger:
      "bg-transparent text-[#b3271e] border-[#b3271e] hover:bg-[#b3271e] hover:text-[#f3f1ea]",
  };

  const sizes = {
    sm: "text-[11px] px-3 py-1.5 gap-1.5",
    md: "text-xs px-4 py-2.5 gap-2",
    lg: "text-sm px-6 py-3 gap-2.5",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-0.5 h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
