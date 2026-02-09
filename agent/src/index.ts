/**
 * Aegis Agent - Main entry point.
 * Orchestrates: API server + scan queue + analysis pipeline + onchain submission.
 */

import "dotenv/config";
import { createAPI } from "./api.js";
import { ScanQueue } from "./queue.js";
import { fetchContractSource, filterCustomFiles } from "./scanner.js";
import { analyzeStatic, countCentralizationFactors } from "./analyzer/static.js";
import { analyzeLLM } from "./analyzer/llm.js";
import { calculateScore } from "./analyzer/scorer.js";
import { generateReport, reportToMarkdown } from "./reporter.js";
import { uploadToIPFS } from "./ipfs.js";
import { OracleClient } from "./onchain.js";
import { upsertReport, type ReportSummary } from "./cache.js";

// Config from env
const PORT = parseInt(process.env.PORT || "3001");
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY || "";
const PINATA_API_KEY = process.env.PINATA_API_KEY || "";
const PINATA_SECRET = process.env.PINATA_SECRET || "";
const ORACLE_ADDRESS = process.env.ORACLE_ADDRESS || "";
const AGENT_PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY || "";
const BSC_RPC_URL = process.env.BSC_RPC_URL || "https://bsc-dataseed1.binance.org";
const SKIP_ONCHAIN = process.env.SKIP_ONCHAIN === "true"; // For local testing without BSC

// Initialize oracle client (if configured)
let oracle: OracleClient | null = null;
if (ORACLE_ADDRESS && AGENT_PRIVATE_KEY && !SKIP_ONCHAIN) {
  oracle = new OracleClient(ORACLE_ADDRESS, AGENT_PRIVATE_KEY, BSC_RPC_URL);
  console.log(`Oracle client initialized. Agent: ${oracle.address}`);
}

/**
 * Full scan pipeline for a single contract address.
 */
async function scanContract(address: string): Promise<void> {
  console.log(`\n=== Scanning ${address} ===`);

  // 1. Fetch source from BSCScan
  console.log("Fetching source code from BSCScan...");
  const source = await fetchContractSource(address, BSCSCAN_API_KEY);
  console.log(`  Contract: ${source.name} | Verified: ${source.verified} | Files: ${source.files.length}`);

  // 2. Static pattern analysis
  console.log("Running static analysis...");
  const customFiles = filterCustomFiles(source.files);
  const allStaticFindings = customFiles.flatMap((file) =>
    analyzeStatic(file.content, source.compilerVersion, file.path)
  );
  console.log(`  Static findings: ${allStaticFindings.length}`);

  // 3. LLM deep analysis (only if verified source available)
  let llmFindings: Awaited<ReturnType<typeof analyzeLLM>> = [];
  if (source.verified && source.sourceCode.length > 0) {
    console.log("Running LLM deep analysis...");
    // For large contracts, analyze only custom files
    const sourceForLLM = customFiles.length > 0
      ? customFiles.map((f) => `// File: ${f.path}\n${f.content}`).join("\n\n")
      : source.sourceCode;
    llmFindings = await analyzeLLM(sourceForLLM, source.name, source.compilerVersion);
    console.log(`  LLM findings: ${llmFindings.length}`);
  } else {
    console.log("  Skipping LLM analysis (source not verified)");
  }

  // 4. Calculate score
  const centralizationFactors = countCentralizationFactors(allStaticFindings);
  const score = calculateScore(allStaticFindings, llmFindings, source.verified, centralizationFactors);
  console.log(`  Risk Score: ${score.riskScore}/100 (${score.riskLevel})`);

  // 5. Generate report
  const allFindings = [...allStaticFindings, ...llmFindings];
  const report = generateReport(
    address,
    source.name,
    source.compilerVersion,
    source.verified,
    score,
    allFindings
  );
  const reportJson = JSON.stringify(report, null, 2);

  // 6. Upload to IPFS
  let ipfsHash = "";
  if (PINATA_API_KEY && PINATA_SECRET) {
    console.log("Uploading report to IPFS...");
    try {
      ipfsHash = await uploadToIPFS(reportJson, address, PINATA_API_KEY, PINATA_SECRET);
      console.log(`  IPFS: ${ipfsHash}`);
    } catch (err) {
      console.error("  IPFS upload failed:", err);
    }
  }

  // 7. Submit onchain
  let txHash = "";
  if (oracle) {
    console.log("Submitting report onchain...");
    try {
      txHash = await oracle.submitReport(
        address,
        score.riskScore,
        ipfsHash || "pending",
        score.totalFindings,
        score.criticalCount,
        score.highCount,
        score.mediumCount,
        score.lowCount,
        source.verified
      );
      console.log(`  TX: ${txHash}`);
    } catch (err) {
      console.error("  Onchain submission failed:", err);
    }
  }

  // 8. Update local cache
  const summary: ReportSummary = {
    address,
    contractName: source.name,
    riskScore: score.riskScore,
    riskLevel: score.riskLevel,
    totalFindings: score.totalFindings,
    criticalCount: score.criticalCount,
    highCount: score.highCount,
    mediumCount: score.mediumCount,
    lowCount: score.lowCount,
    sourceVerified: source.verified,
    ipfsHash,
    txHash,
    timestamp: new Date().toISOString(),
  };
  upsertReport(summary);

  console.log(`=== Done: ${source.name} → Score ${score.riskScore} (${score.riskLevel}) ===\n`);
}

// Initialize scan queue with the pipeline callback
const queue = new ScanQueue(scanContract);

// Listen for onchain AuditRequested events
if (oracle) {
  oracle.listenForRequests((target, requester) => {
    console.log(`Onchain audit requested: ${target} by ${requester}`);
    queue.enqueue(target);
  });
}

// Start API server
createAPI(queue, PORT);

console.log(`
╔══════════════════════════════════════╗
║        AEGIS SECURITY ORACLE         ║
║     AI-Powered Contract Auditing     ║
╠══════════════════════════════════════╣
║  API:     http://localhost:${PORT}       ║
║  Oracle:  ${ORACLE_ADDRESS || "not configured"}  ║
║  BSCScan: ${BSCSCAN_API_KEY ? "configured" : "NOT SET"}               ║
║  IPFS:    ${PINATA_API_KEY ? "configured" : "NOT SET"}               ║
║  Onchain: ${oracle ? "active" : "DISABLED"}                ║
╚══════════════════════════════════════╝
`);
