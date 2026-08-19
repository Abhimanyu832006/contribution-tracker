/**
 * Styled text / number input.
 */
export default function Input({
  label,
  id,
  className = "",
  ...props
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 hover:border-gray-300 ${className}`}
        {...props}
      />
    </div>
  );
}
