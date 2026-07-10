import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-full flex-col gap-4" aria-label="Loading dashboard">
      <div className="flex items-end justify-between gap-4"><div className="space-y-2"><Skeleton className="h-4 w-28 bg-[#dcebea]" /><Skeleton className="h-8 w-72 max-w-full bg-[#dcebea]" /><Skeleton className="h-4 w-96 max-w-full bg-[#eef4f2]" /></div><Skeleton className="hidden h-11 w-28 bg-[#dcebea] sm:block" /></div>
      <Skeleton className="h-40 rounded-xl bg-[#dcebea]" />
      <section className="grid gap-4 xl:grid-cols-12"><Skeleton className="h-80 rounded-xl bg-[#eef4f2] xl:col-span-8" /><div className="grid gap-4 sm:grid-cols-2 xl:col-span-4 xl:grid-cols-1"><Skeleton className="h-36 rounded-xl bg-[#dcebea]" /><Skeleton className="h-48 rounded-xl bg-[#eef4f2]" /></div></section>
      <section className="grid gap-4 xl:grid-cols-12"><Skeleton className="h-64 rounded-xl bg-[#dcebea] xl:col-span-7" /><Skeleton className="h-64 rounded-xl bg-[#eef4f2] xl:col-span-5" /></section>
      <Skeleton className="h-72 rounded-xl bg-[#eef4f2]" />
    </div>
  );
}
