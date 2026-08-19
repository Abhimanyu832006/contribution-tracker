/**
 * Button component with variant support.
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
    "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

  const variants = {
    primary:
      "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm hover:shadow-md",
    secondary:
      "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 focus:ring-indigo-500 shadow-sm",
    ghost:
      "text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-400",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm",
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
