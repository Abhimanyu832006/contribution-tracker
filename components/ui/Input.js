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
          className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] transition-shadow duration-150 rounded focus:outline-none focus:shadow-[3px_3px_0_0_var(--color-primary)] ${className}`}
        {...props}
      />
    </div>
  );
}
