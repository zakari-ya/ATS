import type { Metadata } from "next";

import { FAQSection } from "@/components/marketing/faq-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { FinalCTASection } from "@/components/marketing/final-cta-section";
import { HeroSection } from "@/components/marketing/hero-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { PrivacySection } from "@/components/marketing/privacy-section";
import { TrustStrip } from "@/components/marketing/trust-strip";
import { HomepageJsonLd } from "@/components/seo/homepage-json-ld";
import {
  HOME_DESCRIPTION,
  HOME_TITLE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo/site";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Free ATS CV Checker – Match Your CV to a Job",
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: `${SITE_URL}/`,
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
  },
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userEmail = user?.email ?? null;
  const userName =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    null;

  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#183f3a]">
      <HomepageJsonLd />
      <section className="relative flex h-dvh flex-col overflow-hidden bg-[#fbfaf7]">
        <MarketingHeader userEmail={userEmail} userName={userName} />
        <HeroSection />
      </section>
      <div className="relative isolate overflow-clip bg-white">
        <TrustStrip />
        <HowItWorksSection />
        <FeaturesSection />
        <PrivacySection />
        <FAQSection />
        <FinalCTASection isAuthenticated={Boolean(userEmail)} />
      </div>
      <MarketingFooter userEmail={userEmail} userName={userName} />
    </main>
  );
}
