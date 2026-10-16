import type { MetadataRoute } from "next";
import { siteOrigin } from "@/i18n/seo";

export default function robots(): MetadataRoute.Robots {
  const origin = siteOrigin();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/*/admin", "/*/account/login*", "/*/account/recover*"],
    },
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
