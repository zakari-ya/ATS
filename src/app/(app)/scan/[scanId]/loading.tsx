import { Skeleton } from "@/components/ui/skeleton";

export default function ScanResultLoading() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <section className="rounded-2xl border border-[rgba(31,77,71,0.12)] bg-white p-4 shadow-sm shadow-[#183f3a]/5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="space-y-4">
            <Skeleton className="h-5 w-36 rounded-lg bg-[#dcebea]" />
            <div className="space-y-3">
              <div className="flex gap-2">
                <Skeleton className="h-6 w-24 rounded-full bg-[#dcebea]" />
                <Skeleton className="h-6 w-28 rounded-full bg-[#dcebea]" />
              </div>
              <Skeleton className="h-10 w-full rounded-2xl bg-[#dcebea]" />
              <Skeleton className="h-5 w-full rounded-lg bg-[#eef4f2]" />
            </div>
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-28 rounded-xl bg-[#dcebea]" />
            <Skeleton className="h-10 w-28 rounded-xl bg-[#dcebea]" />
          </div>
        </div>
      </section>

      <section className="grid min-h-0 flex-1 gap-4 xl:grid-cols-12">
        <div className="grid content-start gap-4 xl:col-span-4">
          <Skeleton className="h-72 rounded-2xl bg-[#dcebea]" />
          <Skeleton className="h-96 rounded-2xl bg-[#eef4f2]" />
        </div>
        <div className="grid content-start gap-4 xl:col-span-8">
          <Skeleton className="h-48 rounded-2xl bg-[#eef4f2]" />
          <Skeleton className="h-80 rounded-2xl bg-[#dcebea]" />
          <Skeleton className="h-80 rounded-2xl bg-[#eef4f2]" />
        </div>
      </section>
    </div>
  );
}
