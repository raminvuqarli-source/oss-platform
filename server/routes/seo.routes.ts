import type { Express } from "express";

const BASE_URL = "https://ossaipro.com";

const PUBLIC_PAGES = [
  { path: "/",                  priority: "1.0", changefreq: "weekly"  },
  { path: "/hotel",             priority: "1.0", changefreq: "weekly"  },
  { path: "/restaurant",        priority: "0.9", changefreq: "weekly"  },
  { path: "/login",             priority: "0.5", changefreq: "monthly" },
  { path: "/register-hotel",    priority: "0.8", changefreq: "monthly" },
  { path: "/register-restaurant", priority: "0.7", changefreq: "monthly" },
  { path: "/privacy-policy",    priority: "0.3", changefreq: "yearly"  },
  { path: "/terms-of-service",  priority: "0.3", changefreq: "yearly"  },
];

export function registerSeoRoutes(app: Express) {
  app.get("/sitemap.xml", (_req, res) => {
    const today = new Date().toISOString().split("T")[0];

    const urls = PUBLIC_PAGES.map(
      ({ path, priority, changefreq }) => `
  <url>
    <loc>${BASE_URL}${path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
    ).join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

    res.set("Content-Type", "application/xml");
    res.set("Cache-Control", "public, max-age=3600");
    res.send(xml);
  });
}
