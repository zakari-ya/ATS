import { redirect } from "next/navigation";

import { CvMatchLoginCharacters } from "@/features/auth/components/cvmatch-login-characters";
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
    <main className="min-h-svh overflow-hidden bg-[#f8f7f3] text-[#183f3a]">
      <div className="grid min-h-svh w-full items-center gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:gap-8 lg:px-8">
        <section className="order-2 mx-auto w-full max-w-2xl lg:order-1 lg:max-w-none">
          <CvMatchLoginCharacters />
        </section>

        <section className="order-1 mx-auto w-full max-w-md lg:order-2">
          <LoginCard />
        </section>
      </div>
    </main>
  );
}
