/**
 * Styled select dropdown — matches Input: bold border, focus work-orange.
 */
export default function Select({
  label,
  id,
  children,
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
      <select
        id={id}
        className={`w-full rounded-[3px] border-2 border-[#0e0d0b] bg-white px-3.5 py-2.5 text-sm text-[#0e0d0b] transition-colors duration-150 focus:outline-none focus:border-[#ff4713] appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%230e0d0b%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22/%3E%3C/svg%3E')] bg-no-repeat bg-[position:right_12px_center] pr-10 ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
