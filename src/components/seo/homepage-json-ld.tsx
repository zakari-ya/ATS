import { HOME_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo/site";

export function HomepageJsonLd() {
  const organizationId = `${SITE_URL}/#organization`;
  const websiteId = `${SITE_URL}/#website`;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/logo_cvmatch_bgNO.png`,
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        publisher: { "@id": organizationId },
      },
      {
        "@type": ["SoftwareApplication", "WebApplication"],
        "@id": `${SITE_URL}/#software`,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        description: HOME_DESCRIPTION,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Any",
        isAccessibleForFree: true,
        offers: {
          "@type": "Offer",
          price: "0",
        },
        publisher: { "@id": organizationId },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
      }}
    />
  );
}
