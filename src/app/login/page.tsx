import { redirect } from "next/navigation";

import { LoginCard } from "@/features/auth/components/login-card";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-svh bg-[#f7f4ef] text-[#171412]">
      <div className="mx-auto grid min-h-svh w-full max-w-6xl items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <section className="order-2 hidden lg:block">
          <div className="relative overflow-hidden rounded-[2rem] border border-[#d8d0c2] bg-[#201f1c] p-8 text-white shadow-2xl shadow-stone-900/20">
            <div className="absolute inset-x-8 top-8 h-px bg-gradient-to-r from-transparent via-[#f7f4ef]/40 to-transparent" />
            <div className="mb-16 flex items-center justify-between text-xs uppercase tracking-[0.22em] text-[#d8d0c2]">
              <span>Private CV workspace</span>
              <span>ATS-style review</span>
            </div>
            <div className="space-y-5">
              <p className="text-sm uppercase tracking-[0.28em] text-[#c6a15b]">
                Match before applying
              </p>
              <h1 className="max-w-md text-5xl font-semibold leading-[0.95] tracking-tight">
                Compare your CV with the job post in a focused workspace.
              </h1>
              <p className="max-w-sm text-base leading-7 text-[#d8d0c2]">
                Upload your CV and compare it with any job post before applying.
              </p>
            </div>

            <div className="mt-16 grid gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <div className="mb-3 h-2 w-28 rounded-full bg-[#c6a15b]" />
                <div className="space-y-2">
                  <div className="h-2 rounded-full bg-white/25" />
                  <div className="h-2 w-4/5 rounded-full bg-white/15" />
                  <div className="h-2 w-2/3 rounded-full bg-white/10" />
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#f7f4ef] p-4 text-[#171412]">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-medium">Role fit preview</span>
                  <span className="rounded-full bg-[#d7f0e4] px-2 py-1 text-xs text-[#17623a]">
                    Secure
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="h-2 rounded-full bg-[#d8d0c2]" />
                  <div className="h-2 w-3/4 rounded-full bg-[#d8d0c2]" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="order-1 mx-auto w-full max-w-md lg:order-2">
          <LoginCard />
        </section>
      </div>
    </main>
  );
}
