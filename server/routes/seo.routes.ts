import type { Express } from "express";
import { BLOG_POSTS } from "../data/blog-posts";

const BASE_URL =
  process.env.APP_BASE_URL?.replace(/\/$/, "") ||
  process.env.BASE_URL?.replace(/\/$/, "") ||
  "https://ossaiproapp.com";

const STATIC_PAGES = [
  { path: "/",                    priority: "1.0", changefreq: "weekly"  },
  { path: "/hotel",               priority: "1.0", changefreq: "weekly"  },
  { path: "/restaurant",          priority: "0.9", changefreq: "weekly"  },
  { path: "/blog",                priority: "0.8", changefreq: "weekly"  },
  { path: "/login",               priority: "0.5", changefreq: "monthly" },
  { path: "/register-hotel",      priority: "0.8", changefreq: "monthly" },
  { path: "/register-restaurant", priority: "0.7", changefreq: "monthly" },
  { path: "/privacy-policy",      priority: "0.3", changefreq: "yearly"  },
  { path: "/terms-of-service",    priority: "0.3", changefreq: "yearly"  },
];

export function registerSeoRoutes(app: Express) {
  app.get("/sitemap.xml", (_req, res) => {
    const staticUrls = STATIC_PAGES.map(
      ({ path, priority, changefreq }) => `
  <url>
    <loc>${BASE_URL}${path}</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
    ).join("");

    const blogUrls = BLOG_POSTS.map(
      ({ slug, date }) => `
  <url>
    <loc>${BASE_URL}/blog/${slug}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`,
    ).join("");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticUrls}${blogUrls}
</urlset>`;

    res.set("Content-Type", "application/xml");
    res.set("Cache-Control", "public, max-age=3600");
    res.send(xml);
  });
}
