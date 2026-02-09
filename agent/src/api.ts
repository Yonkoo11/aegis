/**
 * Express API for the Aegis agent.
 * Provides endpoints for the frontend to trigger scans and fetch results.
 */

import express from "express";
import cors from "cors";
import { ScanQueue } from "./queue.js";
import { loadCache, getReportByAddress } from "./cache.js";

export function createAPI(queue: ScanQueue, port: number) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Health check
  app.get("/health", (_req, res) => {
    const state = queue.getQueueState();
    res.json({
      status: "ok",
      queue: state,
      timestamp: new Date().toISOString(),
    });
  });

  // Get all report summaries (for Explorer page)
  app.get("/reports.json", (_req, res) => {
    const reports = loadCache();
    res.json(reports);
  });

  // Get a specific report by address
  app.get("/report/:address", (req, res) => {
    const report = getReportByAddress(req.params.address);
    if (!report) {
      res.status(404).json({ error: "Not audited" });
      return;
    }
    res.json(report);
  });

  // Request a new scan
  app.post("/scan", (req, res) => {
    const { address, force } = req.body;

    if (!address || typeof address !== "string") {
      res.status(400).json({ error: "Missing 'address' in request body" });
      return;
    }

    // Basic address validation
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      res.status(400).json({ error: "Invalid address format" });
      return;
    }

    // Check if already cached
    if (!force) {
      const cached = getReportByAddress(address);
      if (cached) {
        res.json({ status: "completed", report: cached });
        return;
      }
    }

    const result = queue.enqueue(address, !!force);
    if (!result.ok) {
      res.status(429).json({ error: result.message });
      return;
    }

    res.json({
      status: "queued",
      message: result.message,
      position: result.position,
      estimatedTime: `~${(result.position || 1) * 2} minutes`,
    });
  });

  // Check scan status for an address
  app.get("/status/:address", (req, res) => {
    const { address } = req.params;

    // Check if completed (in cache)
    const cached = getReportByAddress(address);
    if (cached) {
      res.json({ status: "completed", report: cached });
      return;
    }

    // Check queue
    const queueItem = queue.getStatus(address);
    if (queueItem) {
      res.json({
        status: queueItem.status,
        error: queueItem.error,
        requestedAt: new Date(queueItem.requestedAt).toISOString(),
      });
      return;
    }

    res.json({ status: "unknown" });
  });

  // Queue state
  app.get("/queue", (_req, res) => {
    res.json(queue.getQueueState());
  });

  app.listen(port, () => {
    console.log(`Aegis API listening on port ${port}`);
  });

  return app;
}
