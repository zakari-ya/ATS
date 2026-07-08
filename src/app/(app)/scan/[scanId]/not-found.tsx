import Link from "next/link";
import { FileSearch, History, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ScanResultNotFound() {
  return (
    <div className="flex h-full min-h-0 items-center">
      <Card className="w-full border-[rgba(31,77,71,0.12)] bg-white shadow-sm shadow-[#183f3a]/5">
        <CardContent className="flex flex-col gap-6 p-6 sm:p-8">
          <div className="space-y-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#eef7f8] text-[#245f6b]">
              <FileSearch className="size-5" aria-hidden="true" />
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-[#183f3a]">
                We could not find this scan.
              </h1>
              <p className="text-base leading-7 text-[#66736f]">
                The result may have been deleted, or this link is no longer
                available in your account.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              className="h-11 rounded-xl bg-[#183f3a] px-4 text-white hover:bg-[#1f4d47]"
            >
              <Link href="/history">
                <History className="size-4" aria-hidden="true" />
                Back to history
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 rounded-xl border-[rgba(31,77,71,0.14)] bg-white px-4 text-[#183f3a] hover:bg-[#eef4f2]"
            >
              <Link href="/scan">
                <Plus className="size-4" aria-hidden="true" />
                New scan
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
