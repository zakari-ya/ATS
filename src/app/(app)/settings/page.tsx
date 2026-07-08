import { Settings } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="grid h-full min-h-0 gap-4 xl:grid-cols-12">
      <Card className="border-[rgba(31,77,71,0.12)] bg-white shadow-sm shadow-[#183f3a]/5 xl:col-span-8">
        <CardHeader className="p-4">
          <div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-[#183f3a] text-white">
            <Settings className="size-5" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight text-[#183f3a]">
            Settings
          </CardTitle>
          <CardDescription className="text-base leading-7 text-[#66736f]">
            Account and privacy controls will live here later. No settings are
            editable in this step.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="rounded-2xl border border-dashed border-[rgba(31,77,71,0.18)] bg-[#f8f7f3] p-5 text-sm leading-6 text-[#66736f]">
            Future step: profile details, privacy controls, and account
            actions.
          </div>
        </CardContent>
      </Card>

      <Card className="border-[rgba(31,77,71,0.12)] bg-[#183f3a] text-white shadow-sm shadow-[#183f3a]/15 xl:col-span-4">
        <CardHeader className="p-4">
          <div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-white text-[#183f3a]">
            <Settings className="size-5" aria-hidden="true" />
          </div>
          <CardTitle className="text-xl font-semibold tracking-tight">
            Workspace controls
          </CardTitle>
          <CardDescription className="text-sm leading-6 text-white/68">
            This app keeps sensitive actions server-side. Scan deletion and
            logout are available where they are already implemented.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
