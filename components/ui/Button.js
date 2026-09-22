/**
 * Button component with variant support.
 * Variants: primary (default), secondary, ghost, danger
 * Sizes: sm, md (default), lg
 *
 * Human voice, not system voice — buttons are actions someone takes, so they
 * read in the same sans as the rest of the UI. Uppercase-mono-everything was
 * its own formula to avoid; that's reserved for actual system metadata now.
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
    "inline-flex items-center justify-center font-medium rounded-none border transition-colors duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:ring-[#1c1a15] disabled:opacity-40 disabled:pointer-events-none";

  const variants = {
    primary:
      "bg-[#1c1a15] text-[#f2ede3] border-[#1c1a15] hover:bg-[#a4451f] hover:border-[#a4451f]",
    secondary:
      "bg-transparent text-[#1c1a15] border-[#1c1a15] hover:bg-[#1c1a15] hover:text-[#f2ede3]",
    ghost:
      "bg-transparent text-[#55503f] border-transparent hover:text-[#1c1a15] hover:border-[#1c1a15]",
    danger:
      "bg-transparent text-[#9c1f1f] border-[#9c1f1f] hover:bg-[#9c1f1f] hover:text-[#f2ede3]",
  };

  const sizes = {
    sm: "text-[13px] px-3 py-1.5 gap-1.5",
    md: "text-sm px-4 py-2.5 gap-2",
    lg: "text-base px-6 py-3 gap-2.5",
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
