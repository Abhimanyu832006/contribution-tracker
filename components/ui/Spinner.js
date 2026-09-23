/**
 * Full-page spinner shown by a route's loading.js while its (fully
 * dynamic, cookie-dependent) server data is being fetched — colored per
 * module so it reads as a continuation of the dashboard tile's own color,
 * not a generic loading state. This is what actually hides the DB round
 * trip: it's tied to real data-readiness via Suspense, not a fixed timer,
 * so it's guaranteed visible for exactly as long as the wait actually is.
 */
export default function Spinner({ accent = "var(--color-primary)" }) {
  return (
    <div className="flex h-64 w-full items-center justify-center">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4"
        style={{
          borderColor: "var(--color-border)",
          borderTopColor: accent,
        }}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
