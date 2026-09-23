import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-3 text-center">
      <p className="text-3xl font-semibold" style={{ color: "var(--color-text-primary)" }}>
        404
      </p>
      <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
        This page doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="mt-1 rounded-md px-4 py-2 text-sm font-medium text-white"
        style={{ backgroundColor: "var(--color-primary)" }}
      >
        Go home
      </Link>
    </div>
  );
}
