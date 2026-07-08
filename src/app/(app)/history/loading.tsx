import { Skeleton } from "@/components/ui/skeleton";

export default function HistoryLoading() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <Skeleton className="h-28 rounded-2xl bg-[#dcebea]" />
      <div className="min-h-0 flex-1 rounded-2xl border border-[rgba(31,77,71,0.12)] bg-white p-3">
        <div className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-52 rounded-2xl bg-[#eef4f2]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
