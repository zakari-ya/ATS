import { redirect } from "next/navigation";
import {
  BadgeCheck,
  CalendarClock,
  LogOut,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserMenu } from "@/components/layout/user-menu";
import { ProfileSettingsForm } from "@/features/settings/components/profile-settings-form";
import { UsageQuotaCard } from "@/features/usage/components/usage-quota-card";
import { getTodayUsageForCurrentUser } from "@/features/usage/get-usage";
import { createClient } from "@/lib/supabase/server";

type ProfileRow = {
  full_name: string | null;
  avatar_url: string | null;
};

function getGoogleDisplayName(userMetadata: Record<string, unknown>): string | null {
  const fullName = userMetadata.full_name;
  const name = userMetadata.name;

  if (typeof fullName === "string" && fullName.trim()) {
    return fullName.trim();
  }

  if (typeof name === "string" && name.trim()) {
    return name.trim();
  }

  return null;
}

function getFallbackName(email: string): string {
  const localPart = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();

  if (!localPart) {
    return "CVMatch user";
  }

  return localPart
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" ");
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    redirect("/login");
  }

  const [{ data: profile }, todayUsage] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle<ProfileRow>(),
    getTodayUsageForCurrentUser(),
  ]);

  if (!todayUsage) {
    redirect("/login");
  }

  const googleDisplayName = getGoogleDisplayName(user.user_metadata);
  const displayName =
    profile?.full_name?.trim() || googleDisplayName || getFallbackName(user.email);

  return (
    <div className="grid items-start gap-4 xl:grid-cols-12">
      <section className="space-y-4 xl:col-span-8">
        <Card className="border-[rgba(31,77,71,0.12)] bg-white shadow-sm shadow-[#183f3a]/5">
          <CardHeader className="p-4">
            <div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-[#183f3a] text-white">
              <Settings className="size-5" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl font-semibold tracking-tight text-[#183f3a]">
              Settings
            </CardTitle>
            <CardDescription className="text-base leading-7 text-[#66736f]">
              Manage your profile, daily limits, and account access from one
              place.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-[rgba(31,77,71,0.12)] bg-white shadow-sm shadow-[#183f3a]/5">
          <CardHeader className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#eef4f2] text-[#183f3a]">
                <UserRound className="size-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold tracking-tight text-[#183f3a]">
                  Profile
                </CardTitle>
                <CardDescription className="mt-1 text-sm leading-6 text-[#66736f]">
                  Choose the name shown in your dashboard and workspace.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <ProfileSettingsForm
              defaultDisplayName={displayName}
              googleDisplayName={googleDisplayName}
              email={user.email}
            />
          </CardContent>
        </Card>

        <Card className="border-[rgba(31,77,71,0.12)] bg-white shadow-sm shadow-[#183f3a]/5">
          <CardHeader className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#eef4f2] text-[#183f3a]">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold tracking-tight text-[#183f3a]">
                  Account access
                </CardTitle>
                <CardDescription className="mt-1 text-sm leading-6 text-[#66736f]">
                  Google OAuth keeps sign-in simple. Sign out here on mobile or
                  desktop.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4 pt-0">
            <div className="grid gap-3 rounded-2xl border border-[rgba(31,77,71,0.12)] bg-[#f8f7f3] p-4 text-sm text-[#365a54] sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[#66736f]">
                  Email
                </p>
                <p className="mt-1 truncate font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-[#66736f]">
                  Provider
                </p>
                <p className="mt-1 inline-flex items-center gap-2 font-medium">
                  <BadgeCheck className="size-4 text-[#276948]" aria-hidden="true" />
                  Google
                </p>
              </div>
            </div>
            <UserMenu email={user.email} />
          </CardContent>
        </Card>
      </section>

      <aside className="grid content-start gap-4 xl:col-span-4">
        <UsageQuotaCard usage={todayUsage} />
        <Card className="border-[#2a625b] bg-[#183f3a] text-white shadow-sm shadow-[#183f3a]/15">
          <CardHeader className="p-4">
            <div className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-white text-[#183f3a]">
              <CalendarClock className="size-5" aria-hidden="true" />
            </div>
            <CardTitle className="text-xl font-semibold tracking-tight">
              Daily limits
            </CardTitle>
            <CardDescription className="text-sm leading-6 text-white/68">
              Limits reset every UTC day and protect free analysis capacity.
              The Scan page still blocks submission server-side when a limit is
              reached.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-[rgba(143,58,50,0.22)] bg-white shadow-sm shadow-[#183f3a]/5">
          <CardHeader className="p-4">
            <div className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-[#fff1ef] text-[#8f3a32]">
              <LogOut className="size-5" aria-hidden="true" />
            </div>
            <CardTitle className="text-xl font-semibold tracking-tight text-[#183f3a]">
              Session control
            </CardTitle>
            <CardDescription className="text-sm leading-6 text-[#66736f]">
              Use sign out when you are finished on a shared phone or computer.
            </CardDescription>
          </CardHeader>
        </Card>
      </aside>
    </div>
  );
}
