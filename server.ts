/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import { PORT, seedDatabaseIfNeeded } from "./serverDb.js";
import { createV1Router } from "./v1Routes.js";

function isProductionMode(): boolean {
  if (process.env.NODE_ENV === "production") return true;
  const distIndex = path.join(process.cwd(), "dist", "index.html");
  return fs.existsSync(distIndex);
}

async function startServer() {
  const app = express();
  const production = isProductionMode();

  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));

  seedDatabaseIfNeeded();

  app.use("/api/v1", createV1Router());

  if (!production) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `Server started (${production ? "production" : "development"}) on http://0.0.0.0:${PORT}`
    );
  });
}

startServer().catch((err) => {
  console.error("Failed to start full stack Express backend service", err);
});
