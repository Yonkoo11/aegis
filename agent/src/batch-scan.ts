/**
 * Batch scanner for populating the Aegis oracle with real BSC contract data.
 * Usage: npx tsx src/batch-scan.ts
 *
 * Scans well-known BSC contracts in two tiers:
 * - Tier 1 (top 15): Full LLM + static analysis
 * - Tier 2 (rest): Static analysis only (saves API costs)
 */

import "dotenv/config";
import { fetchContractSource, filterCustomFiles } from "./scanner.js";
import { analyzeStatic, countCentralizationFactors } from "./analyzer/static.js";
import { analyzeLLM } from "./analyzer/llm.js";
import { calculateScore } from "./analyzer/scorer.js";
import { generateReport } from "./reporter.js";
import { upsertReport, loadCache, type ReportSummary } from "./cache.js";

const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY || "";
const SKIP_LLM = process.env.SKIP_LLM === "true";

// Well-known BSC contracts to scan
const TIER1_CONTRACTS = [
  // DeFi blue chips (full LLM analysis)
  "0x10ed43c718714eb63d5aa57b78b54704e256024e", // PancakeSwap Router V2
  "0x13f4ea83d0bd40e75c8222255bc855a974568dd4", // PancakeSwap Router V3
  "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c", // WBNB
  "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82", // CAKE Token
  "0xcf6bb5389c92bdda8a3747ddb454cb7a64626c63", // Venus (XVS)
  "0xfd5840cd36d94d7229439859c0112a4185bc0255", // Venus vUSDT
  "0xfD36E2c2a6789Db23113685031d7F16329158384", // Venus Unitroller
  "0x55d398326f99059ff775485246999027b3197955", // BSC-USD (USDT)
  "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", // USDC on BSC
  "0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3", // DAI on BSC
  "0x2170ed0880ac9a755fd29b2688956bd959f933f8", // ETH on BSC
  "0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c", // BTCB
  "0xe9e7cea3dedca5984780bafc599bd69add087d56", // BUSD
  "0xa07c5b74c9b40447a954e1466938b865b6bbea36", // Venus vBNB
  "0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16", // PancakeSwap WBNB-BUSD LP
];

const TIER2_CONTRACTS = [
  // Tokens & protocols (static only)
  "0x3ee2200efb3400fabb9aacf31297cbdd1d435d47", // ADA on BSC
  "0xcc42724c6683b7e57334c4e856f4c9965ed682bd", // MATIC on BSC
  "0x1d2f0da169ceb9fc7b3144628db156f3f6c60dbe", // XRP on BSC
  "0x4338665cbb7b2485a8855a139b75d5e34ab0db94", // Litecoin on BSC
  "0x7083609fce4d1d8dc0c979aab8c869ea2c873402", // DOT on BSC
  "0xbf5140a22578168fd562dccf235e5d43a02ce9b1", // UNI on BSC
  "0x0eb3a705fc54725037cc9e008bdede697f62f335", // ATOM on BSC
  "0xf8a0bf9cf54bb92f17374d9e9a321e6a111a51bd", // LINK on BSC
  "0x8595f9da7b868b1822194faed312235e43007b49", // Biswap Router
  "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73", // PancakeSwap Factory V2
  "0x73feaa1ee314f8c655e354234017be2193c9e24e", // PancakeSwap MasterChef
  "0xa5f8c5dbd5f286960b9d90548680ae5ebff07652", // PancakeSwap MasterChef V2
  "0x45c54210128a065de780C4B0Df3d16664f7f859e", // PancakeSwap SmartRouter
  "0xb7f8bc63bbcad18155201308c8f3540b07f84f5e", // Thena Router
  "0x325E343f1dE602396E256B67eFd1F61C3A6B38Bd", // Thena Factory
  "0xD4CEc732b3B135eC52a3c0bc8Ce4b8cFb9dacE46", // Wombat Router
  "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506", // SushiSwap Router BSC
  "0xB6BA90af76D139AB3170c7df0139636dB6120F7e", // ApeSwap Router
  "0xa184998ec58dc1da77a1f9f1e361541257a50cf4", // Alpaca Finance
  "0x858e3312ed3a876947ea49d572a7c42de08af7ee", // Biswap WBNB-USDT LP
];

async function scanOne(address: string, useLLM: boolean): Promise<ReportSummary | null> {
  try {
    const source = await fetchContractSource(address, BSCSCAN_API_KEY);

    if (!source.verified && source.sourceCode.length === 0) {
      console.log(`  [SKIP] ${address} - unverified/no source`);
      // Still create a report for unverified contracts
      const score = calculateScore([], [], false, 0);
      const summary: ReportSummary = {
        address,
        contractName: source.name || "Unverified",
        riskScore: score.riskScore,
        riskLevel: score.riskLevel,
        totalFindings: 0,
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
        sourceVerified: false,
        ipfsHash: "",
        txHash: "",
        timestamp: new Date().toISOString(),
      };
      upsertReport(summary);
      return summary;
    }

    const customFiles = filterCustomFiles(source.files);
    const staticFindings = customFiles.flatMap((file) =>
      analyzeStatic(file.content, source.compilerVersion, file.path)
    );

    let llmFindings: Awaited<ReturnType<typeof analyzeLLM>> = [];
    if (useLLM && !SKIP_LLM && source.verified) {
      const sourceForLLM = customFiles.length > 0
        ? customFiles.map((f) => `// File: ${f.path}\n${f.content}`).join("\n\n")
        : source.sourceCode;
      llmFindings = await analyzeLLM(sourceForLLM, source.name, source.compilerVersion);
    }

    const centralization = countCentralizationFactors(staticFindings);
    const score = calculateScore(staticFindings, llmFindings, source.verified, centralization);
    const allFindings = [...staticFindings, ...llmFindings];

    const summary: ReportSummary = {
      address,
      contractName: source.name,
      riskScore: score.riskScore,
      riskLevel: score.riskLevel,
      totalFindings: allFindings.length,
      criticalCount: score.criticalCount,
      highCount: score.highCount,
      mediumCount: score.mediumCount,
      lowCount: score.lowCount,
      sourceVerified: source.verified,
      ipfsHash: "",
      txHash: "",
      timestamp: new Date().toISOString(),
    };
    upsertReport(summary);

    const mode = useLLM && !SKIP_LLM ? "LLM+static" : "static";
    console.log(`  [OK] ${source.name} → ${score.riskScore}/100 (${score.riskLevel}) [${mode}, ${allFindings.length} findings]`);
    return summary;
  } catch (err) {
    console.error(`  [ERR] ${address}: ${err}`);
    return null;
  }
}

async function main() {
  console.log("=== Aegis Batch Scanner ===\n");
  console.log(`BSCScan API: ${BSCSCAN_API_KEY ? "configured" : "NOT SET"}`);
  console.log(`LLM: ${SKIP_LLM ? "DISABLED" : "enabled"}\n`);

  // Clear old mock data
  loadCache();

  let scanned = 0;
  let failed = 0;

  // Tier 1: Full analysis with LLM
  console.log(`--- Tier 1: ${TIER1_CONTRACTS.length} contracts (LLM + static) ---`);
  for (const addr of TIER1_CONTRACTS) {
    const result = await scanOne(addr, true);
    if (result) scanned++; else failed++;
    // Rate limit: BSCScan free tier is 5 req/sec
    await new Promise(r => setTimeout(r, 1500));
  }

  // Tier 2: Static only
  console.log(`\n--- Tier 2: ${TIER2_CONTRACTS.length} contracts (static only) ---`);
  for (const addr of TIER2_CONTRACTS) {
    const result = await scanOne(addr, false);
    if (result) scanned++; else failed++;
    await new Promise(r => setTimeout(r, 1500));
  }

  const final = loadCache();
  console.log(`\n=== Done: ${scanned} scanned, ${failed} failed, ${final.length} total in cache ===`);
}

main().catch(console.error);
