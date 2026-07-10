import type { Metadata } from "next";

import { FAQSection } from "@/components/marketing/faq-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { FinalCTASection } from "@/components/marketing/final-cta-section";
import { HeroSection } from "@/components/marketing/hero-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { ImprovementJourneySection } from "@/components/marketing/improvement-journey-section";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MatchingJourneySection } from "@/components/marketing/matching-journey-section";
import { PrivacySection } from "@/components/marketing/privacy-section";
import { ProductBoundariesSection } from "@/components/marketing/product-boundaries-section";
import { ScoreEvidenceSection } from "@/components/marketing/score-evidence-section";
import { StoryLine } from "@/components/marketing/story-line";
import { TrustStrip } from "@/components/marketing/trust-strip";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "ATS CV Checker | Job-Specific CV Match Analysis",
  description:
    "Upload your CV, paste a job description, and get an ATS-style match score with missing skills, strong points, and practical improvement suggestions.",
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
      <section className="relative flex h-dvh flex-col overflow-hidden bg-[#fbfaf7]">
        <MarketingHeader userEmail={userEmail} userName={userName} />
        <HeroSection />
      </section>
      <div className="relative isolate overflow-clip">
        <StoryLine />
        <TrustStrip />
        <HowItWorksSection />
        <MatchingJourneySection />
        <FeaturesSection />
        <ScoreEvidenceSection />
        <ImprovementJourneySection />
        <PrivacySection />
        <ProductBoundariesSection />
        <FAQSection />
        <FinalCTASection isAuthenticated={Boolean(userEmail)} />
      </div>
      <MarketingFooter userEmail={userEmail} userName={userName} />
    </main>
  );
}
