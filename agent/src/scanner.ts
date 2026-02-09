/**
 * BSCScan API source code fetcher.
 * Handles both flattened and JSON standard input formats.
 */

export interface ContractSource {
  address: string;
  name: string;
  compilerVersion: string;
  optimizationUsed: boolean;
  runs: number;
  sourceCode: string; // Full source (flattened or concatenated)
  abi: string;
  license: string;
  isProxy: boolean;
  implementationAddress?: string;
  verified: boolean;
  files: SourceFile[]; // Individual files for multi-file contracts
}

export interface SourceFile {
  path: string;
  content: string;
}

const BSCSCAN_API = "https://api.bscscan.com/api";

export async function fetchContractSource(
  address: string,
  apiKey: string
): Promise<ContractSource> {
  const url = `${BSCSCAN_API}?module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== "1" || !data.result?.[0]) {
    return {
      address,
      name: "Unknown",
      compilerVersion: "",
      optimizationUsed: false,
      runs: 0,
      sourceCode: "",
      abi: "",
      license: "",
      isProxy: false,
      verified: false,
      files: [],
    };
  }

  const result = data.result[0];
  const verified = result.SourceCode !== "";
  const files: SourceFile[] = [];
  let fullSource = "";

  if (verified) {
    const raw = result.SourceCode;

    // JSON standard input format: starts with {{ or {
    if (raw.startsWith("{{")) {
      // Double-brace wrapped JSON (BSCScan quirk)
      try {
        const parsed = JSON.parse(raw.slice(1, -1));
        const sources = parsed.sources || {};
        for (const [path, fileObj] of Object.entries(sources)) {
          const content = (fileObj as { content: string }).content;
          files.push({ path, content });
          fullSource += `// File: ${path}\n${content}\n\n`;
        }
      } catch {
        // Fallback to treating as flat source
        fullSource = raw;
        files.push({ path: "contract.sol", content: raw });
      }
    } else if (raw.startsWith("{")) {
      // Single-brace JSON
      try {
        const parsed = JSON.parse(raw);
        const sources = parsed.sources || {};
        for (const [path, fileObj] of Object.entries(sources)) {
          const content = (fileObj as { content: string }).content;
          files.push({ path, content });
          fullSource += `// File: ${path}\n${content}\n\n`;
        }
      } catch {
        fullSource = raw;
        files.push({ path: "contract.sol", content: raw });
      }
    } else {
      // Flat source code
      fullSource = raw;
      files.push({ path: `${result.ContractName || "contract"}.sol`, content: raw });
    }
  }

  return {
    address,
    name: result.ContractName || "Unknown",
    compilerVersion: result.CompilerVersion || "",
    optimizationUsed: result.OptimizationUsed === "1",
    runs: parseInt(result.Runs) || 0,
    sourceCode: fullSource,
    abi: result.ABI || "",
    license: result.LicenseType || "",
    isProxy: result.Proxy === "1",
    implementationAddress: result.Implementation || undefined,
    verified,
    files,
  };
}

/**
 * Filter out standard library files (OpenZeppelin, etc.) to focus on custom logic.
 */
export function filterCustomFiles(files: SourceFile[]): SourceFile[] {
  const standardPrefixes = [
    "@openzeppelin/",
    "@chainlink/",
    "@uniswap/",
    "hardhat/",
    "forge-std/",
    "solmate/",
  ];

  return files.filter(
    (f) => !standardPrefixes.some((prefix) => f.path.includes(prefix))
  );
}
