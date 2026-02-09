/**
 * CLI tool for scanning a single contract (for testing).
 * Usage: npx tsx src/scan-cli.ts <address>
 */

import "dotenv/config";
import { fetchContractSource, filterCustomFiles } from "./scanner.js";
import { analyzeStatic, countCentralizationFactors } from "./analyzer/static.js";
import { analyzeLLM } from "./analyzer/llm.js";
import { calculateScore } from "./analyzer/scorer.js";
import { generateReport, reportToMarkdown } from "./reporter.js";

const address = process.argv[2];
if (!address) {
  console.error("Usage: npx tsx src/scan-cli.ts <contract-address>");
  process.exit(1);
}

const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY || "";
const SKIP_LLM = process.env.SKIP_LLM === "true";

async function main() {
  console.log(`Scanning ${address}...\n`);

  // Fetch source
  const source = await fetchContractSource(address, BSCSCAN_API_KEY);
  console.log(`Contract: ${source.name}`);
  console.log(`Verified: ${source.verified}`);
  console.log(`Compiler: ${source.compilerVersion}`);
  console.log(`Files: ${source.files.length}`);
  console.log(`Source length: ${source.sourceCode.length} chars\n`);

  // Static analysis
  const customFiles = filterCustomFiles(source.files);
  const staticFindings = customFiles.flatMap((file) =>
    analyzeStatic(file.content, source.compilerVersion, file.path)
  );
  console.log(`Static findings: ${staticFindings.length}`);

  // LLM analysis
  let llmFindings: Awaited<ReturnType<typeof analyzeLLM>> = [];
  if (!SKIP_LLM && source.verified) {
    console.log("Running LLM analysis (this may take 30-60s)...");
    const sourceForLLM = customFiles.map((f) => `// File: ${f.path}\n${f.content}`).join("\n\n");
    llmFindings = await analyzeLLM(sourceForLLM, source.name, source.compilerVersion);
    console.log(`LLM findings: ${llmFindings.length}`);
  }

  // Score
  const centralization = countCentralizationFactors(staticFindings);
  const score = calculateScore(staticFindings, llmFindings, source.verified, centralization);

  // Report
  const report = generateReport(
    address, source.name, source.compilerVersion, source.verified, score,
    [...staticFindings, ...llmFindings]
  );

  console.log("\n" + "=".repeat(60));
  console.log(reportToMarkdown(report));
}

main().catch(console.error);
