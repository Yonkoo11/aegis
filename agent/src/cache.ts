/**
 * Local cache for report summaries. Serves as the data source for the frontend Explorer.
 * Stored as reports.json in the data/ directory and served via the API.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_PATH = join(__dirname, "..", "data", "reports.json");

export interface ReportSummary {
  address: string;
  contractName: string;
  riskScore: number;
  riskLevel: string;
  totalFindings: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  sourceVerified: boolean;
  ipfsHash: string;
  txHash: string;
  timestamp: string;
}

export function loadCache(): ReportSummary[] {
  if (!existsSync(CACHE_PATH)) return [];
  try {
    const raw = readFileSync(CACHE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveCache(reports: ReportSummary[]): void {
  writeFileSync(CACHE_PATH, JSON.stringify(reports, null, 2));
}

export function upsertReport(report: ReportSummary): ReportSummary[] {
  const reports = loadCache();
  const idx = reports.findIndex(
    (r) => r.address.toLowerCase() === report.address.toLowerCase()
  );
  if (idx >= 0) {
    reports[idx] = report;
  } else {
    reports.push(report);
  }
  saveCache(reports);
  return reports;
}

export function getReportByAddress(address: string): ReportSummary | undefined {
  const reports = loadCache();
  return reports.find(
    (r) => r.address.toLowerCase() === address.toLowerCase()
  );
}
