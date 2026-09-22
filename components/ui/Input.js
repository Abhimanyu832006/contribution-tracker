/**
 * Styled text / number input.
 * Editorial system: mono uppercase label, sharp-cornered field, ink underline on focus.
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
          className="font-mono text-[11px] uppercase tracking-wider text-[#55503f]"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full rounded-none border border-[rgba(28,26,21,0.2)] bg-[#faf7f0] px-3.5 py-2.5 text-sm text-[#1c1a15] placeholder-[#96907a] transition-colors duration-150 focus:outline-none focus:border-[#1c1a15] ${className}`}
        {...props}
      />
    </div>
  );
}
