export default function Loading() {
  return (
    <div className="flex h-64 w-full items-center justify-center">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2"
        style={{
          borderColor: "var(--color-border)",
          borderTopColor: "var(--color-primary)",
        }}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
