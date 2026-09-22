/**
 * Styled text / number input — bold border, focus flips to work-orange.
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
          className="font-mono text-[11px] font-medium uppercase tracking-wider text-[#55503f]"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full rounded-[3px] border-2 border-[#0e0d0b] bg-white px-3.5 py-2.5 text-sm text-[#0e0d0b] placeholder-[#928c78] transition-colors duration-150 focus:outline-none focus:border-[#ff4713] ${className}`}
        {...props}
      />
    </div>
  );
}
