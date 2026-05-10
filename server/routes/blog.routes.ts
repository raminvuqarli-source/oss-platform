import type { Express } from "express";
import { BLOG_POSTS, findPostBySlug } from "../data/blog-posts";

export function registerBlogRoutes(app: Express) {
  app.get("/api/blog", (_req, res) => {
    const list = BLOG_POSTS.map(({ content: _c, ...rest }) => rest);
    res.set("Cache-Control", "public, max-age=3600");
    res.json(list);
  });

  app.get("/api/blog/:slug", (req, res) => {
    const post = findPostBySlug(req.params.slug);
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.set("Cache-Control", "public, max-age=3600");
    res.json(post);
  });
}
