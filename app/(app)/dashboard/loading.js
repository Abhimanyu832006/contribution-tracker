import Skeleton from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen">
      <header className="border-b-2 border-[var(--color-border)] bg-[var(--color-bg)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8 flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-8 w-56 mt-2" />
            <Skeleton className="h-3 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 pb-16">
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="brutal-card px-4 py-3 sm:px-5 sm:py-4">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-8 w-10 mt-2" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 auto-rows-[140px] sm:auto-rows-[160px] gap-3 sm:gap-4">
          <div className="brutal-card col-span-2 row-span-2 p-4 sm:p-5">
            <Skeleton className="h-7 w-7" />
          </div>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="brutal-card col-span-1 row-span-1 p-4 sm:p-5">
              <Skeleton className="h-7 w-7" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
