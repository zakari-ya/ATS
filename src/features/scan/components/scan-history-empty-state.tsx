import Link from "next/link";
import { FileSearch, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ScanHistoryEmptyState() {
  return (
    <Card className="border-[rgba(31,77,71,0.12)] bg-[#f8f7f3] shadow-none">
      <CardContent className="p-5 sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#183f3a] text-white">
              <FileSearch className="size-5" aria-hidden="true" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-[#183f3a]">
                No scans yet
              </h2>
              <p className="text-base leading-7 text-[#66736f]">
                Start your first CV match analysis by uploading your CV and
                pasting a job post.
              </p>
            </div>
          </div>

          <Button
            asChild
            className="h-11 rounded-xl bg-[#183f3a] px-4 text-white hover:bg-[#1f4d47]"
          >
            <Link href="/scan">
              <Plus className="size-4" aria-hidden="true" />
              New Scan
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
