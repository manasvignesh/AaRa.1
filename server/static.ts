import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.join(process.cwd(), "dist");
  if (!fs.existsSync(distPath)) {
    // try public if dist doesn't exist (fallback)
    const publicPath = path.join(process.cwd(), "public");
    if (fs.existsSync(publicPath)) {
      app.use(express.static(publicPath));
      return;
    }
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve static assets with proper cache headers
  app.use(express.static(distPath, {
    maxAge: '1d',
    index: false,  // Don't auto-serve index.html for directory requests
  }));

  // SPA fallback: only for requests that don't have a file extension
  // This prevents intercepting /assets/index-abc.css or /assets/index-abc.js
  app.use((req, res, next) => {
    // If the request has a file extension, it's a missing static asset — let it 404
    if (path.extname(req.path)) {
      return next();
    }
    // Otherwise serve index.html for SPA client-side routing
    res.sendFile(path.join(distPath, "index.html"));
  });
}
