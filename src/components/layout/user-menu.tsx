import { LogOut, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { logout } from "@/features/auth/actions";

type UserMenuProps = {
  email?: string | null;
  compact?: boolean;
  variant?: "light" | "dark";
};

export function UserMenu({
  email,
  compact = false,
  variant = "light",
}: UserMenuProps) {
  const isDark = variant === "dark";

  return (
    <div
      className={[
        "flex gap-3 rounded-2xl border p-3",
        isDark
          ? "border-white/10 bg-white/[0.06] text-white"
          : "border-[rgba(31,77,71,0.12)] bg-white text-[#183f3a]",
        compact
          ? "items-center"
          : "flex-col sm:min-w-72 sm:flex-row sm:items-center sm:justify-between",
      ].join(" ")}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={[
            "flex size-9 shrink-0 items-center justify-center rounded-xl",
            isDark ? "bg-white text-[#183f3a]" : "bg-[#183f3a] text-white",
          ].join(" ")}
        >
          <UserRound className="size-4" aria-hidden="true" />
        </div>
        <div className={compact ? "hidden min-w-0 md:block" : "min-w-0"}>
          <p
            className={[
              "text-xs font-medium uppercase tracking-[0.16em]",
              isDark ? "text-white/48" : "text-[#66736f]",
            ].join(" ")}
          >
            Signed in
          </p>
          <p
            className={[
              "truncate text-sm font-medium",
              isDark ? "text-white" : "text-[#183f3a]",
            ].join(" ")}
          >
            {email ?? "Authenticated user"}
          </p>
        </div>
      </div>
      <form action={logout}>
        <Button
          type="submit"
          variant="outline"
          size={compact ? "icon-lg" : "default"}
          aria-label="Sign out"
          className={[
            "h-10 w-full rounded-xl sm:w-auto",
            isDark
              ? "border-white/12 bg-white/8 text-white hover:bg-white/14"
              : "border-[rgba(31,77,71,0.14)] bg-white text-[#183f3a] hover:bg-[#eef4f2]",
          ].join(" ")}
        >
          <LogOut className="size-4" aria-hidden="true" />
          <span className={compact ? "sr-only" : ""}>Sign out</span>
        </Button>
      </form>
    </div>
  );
}
