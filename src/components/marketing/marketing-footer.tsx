import Link from "next/link";

import { BrandLink } from "@/components/shared/brand-link";
import { SectionShell } from "./section-shell";

type MarketingFooterProps = {
  userEmail?: string | null;
  userName?: string | null;
};

const productLinks = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Example result" },
  { href: "#privacy", label: "Privacy" },
  { href: "#faq", label: "Questions" },
];

export function MarketingFooter({ userEmail, userName }: MarketingFooterProps) {
  const isAuthenticated = Boolean(userEmail);
  const userLabel = userName || userEmail?.split("@")[0] || "Account";

  return (
    <SectionShell as="footer" className="bg-[#143934] pb-8 pt-12 text-white">
      <div className="grid gap-10 border-b border-white/10 pb-10 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="max-w-md">
          <BrandLink href="/" variant="dark" className="text-[1.8rem]" />
          <p className="mt-4 text-sm leading-7 text-white/64">
            CVMatch provides ATS-style CV feedback. It does not make hiring
            decisions or guarantee job outcomes.
          </p>
          {isAuthenticated ? <p className="mt-4 text-sm text-[#b9d4ce]">Signed in as {userLabel}</p> : null}
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          <FooterGroup title="Product" links={productLinks} />
          <FooterGroup title="App" links={isAuthenticated ? [
            { href: "/dashboard", label: "Dashboard" },
            { href: "/scan", label: "New scan" },
            { href: "/history", label: "History" },
          ] : [
            { href: "/login", label: "Log in" },
            { href: "/scan", label: "Start scan" },
          ]} />
          <FooterGroup title="Data" links={[
            { href: "#privacy", label: "Privacy and control" },
            { href: "#faq", label: "Deletion workflow" },
          ]} />
        </div>
      </div>
      <div className="flex flex-col gap-2 pt-6 text-xs text-white/46 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getUTCFullYear()} CVMatch</p>
        <p>Job-specific feedback, not a hiring decision.</p>
      </div>
    </SectionShell>
  );
}

function FooterGroup({ title, links }: { title: string; links: Array<{ href: string; label: string }> }) {
  return (
    <div>
      <p className="text-xs font-medium text-white/44">{title}</p>
      <ul className="mt-4 space-y-3 text-sm text-white/68">
        {links.map((link) => <li key={link.label}><Link href={link.href} className="transition-colors hover:text-white">{link.label}</Link></li>)}
      </ul>
    </div>
  );
}
