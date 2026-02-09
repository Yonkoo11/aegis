/**
 * Claude LLM-powered deep analysis for Solidity contracts.
 * Structured prompts for business logic, economic attacks, and centralization risks.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { StaticFinding } from "./static.js";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are an expert smart contract security auditor with deep experience in DeFi protocols on BNB Chain. You have found critical vulnerabilities in production protocols including reentrancy, access control flaws, oracle manipulation, and economic exploits.

Your task: Analyze the provided Solidity source code and identify security vulnerabilities.

For each finding, respond in this exact JSON format:
{
  "findings": [
    {
      "id": "LLM_<SHORT_ID>",
      "title": "Brief title",
      "severity": "critical|high|medium|low|info",
      "description": "Detailed explanation of the vulnerability and its impact",
      "line": <line_number_or_null>,
      "confidence": "high|medium|low"
    }
  ]
}

Severity guide:
- critical: Direct theft of funds, permanent freezing of funds, unauthorized minting
- high: Theft of unclaimed yield, permanent DoS of critical functions, manipulation of governance votes
- medium: Griefing attacks, theft of gas, unbounded gas consumption, temporary DoS
- low: Missing events, suboptimal patterns, minor gas inefficiencies
- info: Best practice suggestions, code quality improvements

Focus on:
1. Business logic flaws (incorrect state transitions, missing validations)
2. Economic attack vectors (flash loans, oracle manipulation, sandwich attacks, MEV)
3. Access control gaps (missing modifiers, privilege escalation)
4. Reentrancy (cross-function, cross-contract, read-only)
5. Token handling (approval race conditions, fee-on-transfer, rebasing tokens)
6. External call safety (unchecked returns, callback attacks)
7. Centralization risks (admin backdoors, upgrade risks, single points of failure)

Do NOT flag:
- Known patterns that are intentionally used (e.g., OpenZeppelin's Ownable)
- Compiler version suggestions for 0.8.x+ contracts
- Gas optimizations unless they cause DoS risk
- Style issues

Be precise. Only report findings you're confident about. False positives destroy trust.`;

export async function analyzeLLM(
  sourceCode: string,
  contractName: string,
  compilerVersion: string
): Promise<StaticFinding[]> {
  // Truncate source to ~100K chars to stay within context limits
  const truncatedSource = sourceCode.length > 100_000
    ? sourceCode.substring(0, 100_000) + "\n// ... truncated ..."
    : sourceCode;

  const userPrompt = `Analyze this Solidity contract for security vulnerabilities:

Contract: ${contractName}
Compiler: ${compilerVersion}

\`\`\`solidity
${truncatedSource}
\`\`\`

Return your findings as JSON. If no vulnerabilities are found, return {"findings": []}.`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => {
        if (block.type === "text") return block.text;
        return "";
      })
      .join("");

    // Extract JSON from response (may be wrapped in markdown code block)
    const jsonMatch = text.match(/\{[\s\S]*"findings"[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("LLM response did not contain valid JSON findings");
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed.findings)) return [];

    return parsed.findings.map(
      (f: {
        id?: string;
        title?: string;
        severity?: string;
        description?: string;
        line?: number;
        confidence?: string;
      }) => ({
        id: f.id || "LLM_UNKNOWN",
        title: f.title || "Unknown finding",
        severity: validateSeverity(f.severity),
        description: f.description || "",
        pattern: "LLM analysis",
        line: f.line || undefined,
        confidence: validateConfidence(f.confidence),
      })
    );
  } catch (error) {
    console.error("LLM analysis failed:", error);
    return [];
  }
}

function validateSeverity(s?: string): StaticFinding["severity"] {
  const valid = ["critical", "high", "medium", "low", "info"] as const;
  if (s && valid.includes(s as (typeof valid)[number])) return s as StaticFinding["severity"];
  return "info";
}

function validateConfidence(c?: string): StaticFinding["confidence"] {
  const valid = ["high", "medium", "low"] as const;
  if (c && valid.includes(c as (typeof valid)[number])) return c as StaticFinding["confidence"];
  return "medium";
}
