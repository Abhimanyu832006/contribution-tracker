import Skeleton from "@/components/ui/Skeleton";

export default function ScoresLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-80 mt-2" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="brutal-card p-6">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-16 mt-2" />
          </div>
        ))}
      </div>

      <div className="brutal-card p-0 overflow-hidden">
        <div className="h-11 w-full" style={{ background: "var(--color-primary)" }} />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3 border-t-2 border-[var(--color-border)]">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}
