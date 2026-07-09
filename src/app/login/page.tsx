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
    <main className="min-h-svh bg-[#f8f7f3] text-[#183f3a] lg:overflow-hidden">
      <div className="grid w-full gap-4 px-4 py-4 sm:px-6 sm:py-6 lg:min-h-svh lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-8 lg:px-8">
        <section className="order-2 mx-auto w-full max-w-lg lg:order-1 lg:max-w-none">
          <CvMatchLoginCharacters />
        </section>

        <section className="order-1 mx-auto w-full max-w-md self-start lg:order-2 lg:self-center">
          <LoginCard />
        </section>
      </div>
    </main>
  );
}
