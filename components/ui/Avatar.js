import Image from "next/image";

/**
 * Avatar — circular image with fallback initials.
 * Sizes: xs (20px), sm (32px), md (40px), lg (56px), xl (72px)
 */
export default function Avatar({
  src,
  alt = "",
  name = "",
  size = "md",
  className = "",
}) {
  const sizes = {
    xs: "w-5 h-5 text-[9px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-lg",
    xl: "w-[72px] h-[72px] text-xl",
  };

  const pxSizes = { xs: 20, sm: 32, md: 40, lg: 56, xl: 72 };

  const initials = name
    ? name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  if (src) {
    return (
      <Image
        src={src}
        alt={alt || name}
        width={pxSizes[size]}
        height={pxSizes[size]}
        className={`rounded-full object-cover border-2 border-[var(--color-border)] ${sizes[size]} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] font-black flex items-center justify-center border-2 border-[var(--color-border)] ${sizes[size]} ${className}`}
    >
      {initials}
    </div>
  );
}
