/**
 * Button — solid, high-contrast, a little heavy. Variants: primary
 * (ink, flips to work-orange on hover), signal (cobalt, for GitHub
 * actions), secondary (outline), ghost, danger (flagged red).
 * Sizes: sm, md (default), lg
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
    "inline-flex items-center justify-center font-semibold rounded-[3px] border-2 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0e0d0b] disabled:opacity-40 disabled:pointer-events-none active:scale-[0.97]";

  const variants = {
    primary:
      "bg-[#0e0d0b] text-[#f4f2ec] border-[#0e0d0b] hover:bg-[#ff4713] hover:border-[#ff4713]",
    signal:
      "bg-[#1a3fd6] text-[#f4f2ec] border-[#1a3fd6] hover:bg-[#0e2590] hover:border-[#0e2590]",
    secondary:
      "bg-transparent text-[#0e0d0b] border-[#0e0d0b] hover:bg-[#0e0d0b] hover:text-[#f4f2ec]",
    ghost:
      "bg-transparent text-[#55503f] border-transparent hover:text-[#0e0d0b] hover:border-[#0e0d0b]",
    danger:
      "bg-[#e11d2e] text-[#f4f2ec] border-[#e11d2e] hover:bg-[#b8172a] hover:border-[#b8172a]",
  };

  const sizes = {
    sm: "text-[13px] px-3 py-1.5 gap-1.5",
    md: "text-sm px-4 py-2.5 gap-2",
    lg: "text-base px-6 py-3.5 gap-2.5",
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
