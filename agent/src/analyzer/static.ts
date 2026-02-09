/**
 * Static pattern analysis for Solidity smart contracts.
 * Detects common vulnerability patterns using regex + heuristics.
 * Fast, deterministic — runs before the LLM for baseline findings.
 */

export interface StaticFinding {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  description: string;
  pattern: string;
  line?: number;
  file?: string;
  confidence: "high" | "medium" | "low";
}

interface PatternRule {
  id: string;
  title: string;
  severity: StaticFinding["severity"];
  pattern: RegExp;
  description: string;
  confidence: StaticFinding["confidence"];
  // If true, absence of pattern is the finding (e.g., missing SafeMath)
  inverted?: boolean;
  // Only apply to contracts with compiler < 0.8.0
  preSolidity08Only?: boolean;
}

const PATTERNS: PatternRule[] = [
  // === Critical ===
  {
    id: "SELFDESTRUCT",
    title: "Selfdestruct present",
    severity: "critical",
    pattern: /selfdestruct\s*\(|suicide\s*\(/g,
    description:
      "Contract contains selfdestruct which can permanently destroy the contract and send remaining ETH/BNB to an arbitrary address.",
    confidence: "high",
  },
  {
    id: "DELEGATECALL_USER_INPUT",
    title: "Delegatecall with user-controlled input",
    severity: "critical",
    pattern: /\.delegatecall\s*\(/g,
    description:
      "Delegatecall executes code in the context of the calling contract. If the target is user-controlled, an attacker can execute arbitrary code.",
    confidence: "medium",
  },

  // === High ===
  {
    id: "REENTRANCY",
    title: "Potential reentrancy",
    severity: "high",
    pattern:
      /\.call\{[^}]*value\s*:.*?\}|\.transfer\(|\.send\(/g,
    description:
      "External call that transfers value detected. If state changes occur after this call, the contract may be vulnerable to reentrancy.",
    confidence: "medium",
  },
  {
    id: "TX_ORIGIN",
    title: "tx.origin used for authentication",
    severity: "high",
    pattern: /tx\.origin/g,
    description:
      "tx.origin returns the original sender of the transaction. Using it for auth is vulnerable to phishing attacks where a malicious contract forwards calls.",
    confidence: "high",
  },
  {
    id: "UNCHECKED_LOW_LEVEL",
    title: "Unchecked low-level call return value",
    severity: "high",
    pattern:
      /(?:address\s*\([^)]*\)\s*)?\.call\{?[^}]*\}?\s*\([^)]*\)\s*;/g,
    description:
      "Low-level call without checking the return value. If the call fails silently, the contract may continue with incorrect state.",
    confidence: "medium",
  },

  // === Medium ===
  {
    id: "MISSING_ZERO_CHECK",
    title: "Missing zero-address validation",
    severity: "medium",
    pattern:
      /function\s+(?:set|update|change|transfer)\w*\s*\([^)]*address\s+\w+[^)]*\)/g,
    description:
      "Setter function takes an address parameter without checking for address(0). Setting critical addresses to zero can brick the contract.",
    confidence: "low",
  },
  {
    id: "ARBITRARY_SEND",
    title: "Arbitrary ETH/BNB transfer",
    severity: "medium",
    pattern: /\.call\{[^}]*value\s*:[^}]+\}\s*\(\s*""\s*\)/g,
    description:
      "ETH/BNB sent to an address that may be user-controlled. Verify the recipient is intended.",
    confidence: "medium",
  },
  {
    id: "BLOCK_TIMESTAMP",
    title: "Block timestamp used for critical logic",
    severity: "medium",
    pattern: /block\.timestamp/g,
    description:
      "block.timestamp can be slightly manipulated by miners/validators (~15 seconds). Avoid using it as the sole source of randomness or for precise timing.",
    confidence: "low",
  },
  {
    id: "UNSAFE_CAST",
    title: "Unsafe type casting",
    severity: "medium",
    pattern: /uint(?:8|16|32|64|128)\s*\(\s*\w+\s*\)/g,
    description:
      "Downcasting without overflow check. In Solidity >=0.8.0 this reverts on overflow, but in <0.8.0 it silently truncates.",
    confidence: "low",
  },

  // === Low ===
  {
    id: "MISSING_EVENTS",
    title: "State change without event emission",
    severity: "low",
    pattern:
      /function\s+(?:set|update|change|pause|unpause|withdraw|deposit)\w*\s*\([^)]*\)[^{]*\{(?:(?!emit\s+\w+)[^}])*\}/gs,
    description:
      "State-changing function does not emit an event. Events are important for off-chain monitoring and transparency.",
    confidence: "low",
  },
  {
    id: "PUBLIC_FUNC",
    title: "Function could be external instead of public",
    severity: "info",
    pattern: /function\s+\w+\s*\([^)]*\)\s+public\b(?!\s+view|\s+pure)/g,
    description:
      "Public functions that are never called internally should be declared external to save gas.",
    confidence: "low",
  },

  // === Centralization ===
  {
    id: "CENTRALIZATION_PROXY",
    title: "Upgradeable proxy pattern detected",
    severity: "medium",
    pattern:
      /upgradeTo\s*\(|_upgradeTo\s*\(|ERC1967Upgrade|TransparentUpgradeableProxy|UUPSUpgradeable/g,
    description:
      "Contract uses an upgradeable proxy. The admin can change the implementation at any time, potentially introducing malicious code.",
    confidence: "high",
  },
  {
    id: "CENTRALIZATION_PAUSE",
    title: "Pausable functionality",
    severity: "low",
    pattern: /Pausable|whenNotPaused|_pause\s*\(\)|paused\s*\(\)/g,
    description:
      "Contract can be paused by an admin, freezing user funds. Check if there's a timelock or multisig on the pause functionality.",
    confidence: "high",
  },
  {
    id: "CENTRALIZATION_MINT",
    title: "Unrestricted mint capability",
    severity: "medium",
    pattern: /function\s+mint\s*\([^)]*\)[^{]*\{/g,
    description:
      "Mint function detected. If callable by a single admin without supply cap, it can dilute token holders.",
    confidence: "medium",
  },
  {
    id: "CENTRALIZATION_FEE",
    title: "Admin-controlled fee mechanism",
    severity: "low",
    pattern:
      /function\s+(?:set|update|change)(?:Fee|Tax|Rate)\s*\(/g,
    description:
      "Admin can change fees. Verify there's a maximum cap to prevent setting fees to 100%.",
    confidence: "medium",
  },
];

/**
 * Run static analysis on Solidity source code.
 */
export function analyzeStatic(
  sourceCode: string,
  compilerVersion: string,
  fileName?: string
): StaticFinding[] {
  const findings: StaticFinding[] = [];
  const isSolidity08Plus =
    compilerVersion.includes("0.8.") ||
    compilerVersion.includes("0.9.") ||
    parseInt(compilerVersion.split(".")[1] || "0") >= 8;

  for (const rule of PATTERNS) {
    if (rule.preSolidity08Only && isSolidity08Plus) continue;

    const matches = sourceCode.matchAll(rule.pattern);
    let found = false;

    for (const match of matches) {
      found = true;
      const line = match.index
        ? sourceCode.substring(0, match.index).split("\n").length
        : undefined;

      findings.push({
        id: rule.id,
        title: rule.title,
        severity: rule.severity,
        description: rule.description,
        pattern: match[0].substring(0, 100),
        line,
        file: fileName,
        confidence: rule.confidence,
      });
    }

    if (rule.inverted && !found) {
      findings.push({
        id: rule.id,
        title: rule.title,
        severity: rule.severity,
        description: rule.description,
        pattern: "Pattern not found (inverted rule)",
        confidence: rule.confidence,
        file: fileName,
      });
    }
  }

  // Deduplicate by id (keep only first occurrence of each pattern type)
  // But keep all reentrancy/unchecked findings since they may be in different locations
  const deduped: StaticFinding[] = [];
  const seenNonRepeatable = new Set<string>();
  const repeatableIds = new Set(["REENTRANCY", "UNCHECKED_LOW_LEVEL", "MISSING_ZERO_CHECK"]);

  for (const finding of findings) {
    if (repeatableIds.has(finding.id)) {
      deduped.push(finding);
    } else if (!seenNonRepeatable.has(finding.id)) {
      seenNonRepeatable.add(finding.id);
      deduped.push(finding);
    }
  }

  return deduped;
}

/**
 * Count centralization factors for the scoring formula.
 */
export function countCentralizationFactors(findings: StaticFinding[]): number {
  const centralIds = new Set([
    "CENTRALIZATION_PROXY",
    "CENTRALIZATION_PAUSE",
    "CENTRALIZATION_MINT",
    "CENTRALIZATION_FEE",
  ]);
  const found = new Set<string>();
  for (const f of findings) {
    if (centralIds.has(f.id)) found.add(f.id);
  }
  return found.size;
}
