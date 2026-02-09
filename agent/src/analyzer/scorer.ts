/**
 * Risk score calculator.
 * Proportional formula with diminishing returns.
 */

import type { StaticFinding } from "./static.js";

export interface ScoreBreakdown {
  riskScore: number; // 0-100
  criticalScore: number;
  highScore: number;
  mediumScore: number;
  unverifiedScore: number;
  centralizationScore: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  totalFindings: number;
  riskLevel: "low" | "medium" | "high" | "critical";
}

export function calculateScore(
  findings: StaticFinding[],
  llmFindings: StaticFinding[],
  sourceVerified: boolean,
  centralizationFactors: number
): ScoreBreakdown {
  const allFindings = [...findings, ...llmFindings];

  // Deduplicate by id + line (same finding at same location)
  const seen = new Set<string>();
  const unique = allFindings.filter((f) => {
    const key = `${f.id}:${f.line ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const criticalCount = unique.filter((f) => f.severity === "critical").length;
  const highCount = unique.filter((f) => f.severity === "high").length;
  const mediumCount = unique.filter((f) => f.severity === "medium").length;
  const lowCount = unique.filter((f) => f.severity === "low").length;
  const infoCount = unique.filter((f) => f.severity === "info").length;

  // Proportional scoring with caps
  const criticalScore = Math.min(40, criticalCount * 20);
  const highScore = Math.min(25, highCount * 10);
  const mediumScore = Math.min(15, mediumCount * 5);
  const unverifiedScore = sourceVerified ? 0 : 10;
  const centralizationScore = Math.min(10, centralizationFactors * 3);

  const riskScore = Math.min(
    100,
    criticalScore + highScore + mediumScore + unverifiedScore + centralizationScore
  );

  let riskLevel: ScoreBreakdown["riskLevel"];
  if (riskScore <= 20) riskLevel = "low";
  else if (riskScore <= 50) riskLevel = "medium";
  else if (riskScore <= 75) riskLevel = "high";
  else riskLevel = "critical";

  return {
    riskScore,
    criticalScore,
    highScore,
    mediumScore,
    unverifiedScore,
    centralizationScore,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    infoCount,
    totalFindings: unique.length,
    riskLevel,
  };
}
