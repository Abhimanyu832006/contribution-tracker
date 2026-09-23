import Skeleton from "@/components/ui/Skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-10">
      <div>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-96 mt-2" />
      </div>

      <div className="brutal-card p-6 space-y-4" style={{ borderLeft: "6px solid var(--color-github)" }}>
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-4">
          <Skeleton className="h-11 flex-1" />
          <Skeleton className="h-11 w-32" />
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-3 w-32" />
        <div className="brutal-card p-6" style={{ borderLeft: "6px solid var(--color-settings)" }}>
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="brutal-card p-5 flex items-center gap-4">
              <Skeleton className="h-14 w-14 rounded-full shrink-0" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
