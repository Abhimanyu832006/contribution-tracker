import Skeleton from "@/components/ui/Skeleton";

export default function ContributionDetailLoading() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-7 w-56 mt-2" />
      </div>

      <div className="brutal-card p-6 space-y-6">
        <div className="flex items-center gap-3.5">
          <Skeleton className="h-14 w-14 rounded-full shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24 mt-2" />
          </div>
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="grid grid-cols-2 gap-4 pt-2 border-t-2 border-[var(--color-border)]">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}
