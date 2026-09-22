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
          className="font-mono text-[11px] uppercase tracking-wider text-[#4a473f]"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full rounded-none border border-[rgba(20,19,17,0.2)] bg-[#faf9f5] px-3.5 py-2.5 text-sm text-[#141311] placeholder-[#8a8578] transition-colors duration-150 focus:outline-none focus:border-[#141311] ${className}`}
        {...props}
      />
    </div>
  );
}
