import Skeleton from "@/components/ui/Skeleton";

export default function PeerVerificationLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-96 mt-2" />
      </div>

      <div className="brutal-card p-4" style={{ background: "var(--color-verification-light)" }}>
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-4 w-full max-w-sm mt-2" />
      </div>

      <div className="flex items-center gap-1 p-1 border-2 border-[var(--color-border)] bg-[var(--color-bg)] rounded w-fit">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-7 w-16 m-0.5" />
        ))}
      </div>

      <div className="space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="brutal-card p-5 flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-8 w-20 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
