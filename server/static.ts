import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  const assetsPath = path.resolve(distPath, "assets");
  if (fs.existsSync(assetsPath)) {
    app.use(
      "/assets",
      express.static(assetsPath, {
        maxAge: "1y",
        immutable: true,
        etag: true,
        lastModified: false,
      }),
    );
  }

  app.use(
    express.static(distPath, {
      maxAge: 0,
      etag: true,
      lastModified: true,
      index: false,
    }),
  );

  app.use("/{*path}", (_req, res) => {
    res.set({
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    });
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
