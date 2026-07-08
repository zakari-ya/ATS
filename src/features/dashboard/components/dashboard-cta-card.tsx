import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function DashboardCtaCard() {
  return (
    <Card className="overflow-hidden border-[#2a625b] bg-[#183f3a] text-white shadow-sm shadow-[#183f3a]/15">
      <CardHeader className="gap-4 p-4">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-white text-[#183f3a]">
          <FileText className="size-5" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-xl font-semibold tracking-tight">
            Start a new CV match
          </CardTitle>
          <CardDescription className="text-sm leading-6 text-white/68">
            Upload a text-based CV PDF and paste a job post to get a structured
            match analysis.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0">
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm leading-6 text-white/68">
          The scan flow validates your CV on the server, extracts text safely,
          and stores only lightweight summary data on the dashboard.
        </div>
        <Button
          asChild
          className="h-11 w-full rounded-xl bg-white text-[#183f3a] hover:bg-[#eef4f2]"
        >
          <Link href="/scan">
            New scan
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
