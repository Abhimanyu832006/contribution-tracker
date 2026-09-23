/**
 * Button component with variant support — neo-brutalist: thick border,
 * hard offset shadow that compresses on press.
 * Variants: primary (default), secondary, ghost, danger
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
    "brutal-btn inline-flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary)] disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    primary: "bg-[var(--color-primary)] text-white",
    secondary: "bg-[var(--color-surface)] text-[var(--color-text-primary)]",
    ghost: "border-transparent shadow-none text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-black/5",
    danger: "bg-[var(--color-danger)] text-white",
  };

  const sizes = {
    sm: "text-xs px-3 py-1.5 gap-1.5",
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
