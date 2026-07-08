import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <Skeleton className="h-28 rounded-2xl bg-[#dcebea]" />
      <section className="grid min-h-0 flex-1 gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-8">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-32 rounded-2xl bg-[#eef4f2]" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-2xl bg-[#dcebea]" />
        </div>
        <div className="grid content-start gap-4 xl:col-span-4">
          <Skeleton className="h-72 rounded-2xl bg-[#eef4f2]" />
          <Skeleton className="h-64 rounded-2xl bg-[#dcebea]" />
        </div>
      </section>
    </div>
  );
}
