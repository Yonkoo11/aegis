/**
 * Onchain interaction with SecurityOracle contract via ethers.js.
 */

import { ethers } from "ethers";

const ORACLE_ABI = [
  "function submitReport(address target, uint8 riskScore, string ipfsHash, uint16 findingsCount, uint8 criticalCount, uint8 highCount, uint8 mediumCount, uint8 lowCount, bool sourceVerified) external",
  "function getScore(address target) external view returns (uint8)",
  "function getScores(address[] targets) external view returns (uint8[])",
  "function isAudited(address target) external view returns (bool)",
  "function getReport(address target) external view returns (uint8, string, uint256, uint16, uint8, uint8, uint8, uint8, bool)",
  "function getAuditedContracts(uint256 offset, uint256 limit) external view returns (address[])",
  "function getAuditedCount() external view returns (uint256)",
  "function totalAudits() external view returns (uint256)",
  "event AuditRequested(address indexed target, address indexed requester)",
  "event ReportSubmitted(address indexed target, uint8 riskScore, string ipfsHash)",
];

const POLL_INTERVAL_MS = 15_000; // Poll for events every 15s

export class OracleClient {
  private contract: ethers.Contract;
  private signer: ethers.Wallet;
  private lastBlock: number = 0;
  private pollTimer?: ReturnType<typeof setInterval>;

  constructor(
    oracleAddress: string,
    privateKey: string,
    rpcUrl: string
  ) {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    this.signer = new ethers.Wallet(privateKey, provider);
    this.contract = new ethers.Contract(oracleAddress, ORACLE_ABI, this.signer);
  }

  async submitReport(
    target: string,
    riskScore: number,
    ipfsHash: string,
    findingsCount: number,
    criticalCount: number,
    highCount: number,
    mediumCount: number,
    lowCount: number,
    sourceVerified: boolean
  ): Promise<string> {
    const tx = await this.contract.submitReport(
      target,
      riskScore,
      ipfsHash,
      findingsCount,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      sourceVerified
    );
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async isAudited(target: string): Promise<boolean> {
    return this.contract.isAudited(target);
  }

  async getScore(target: string): Promise<number> {
    return Number(await this.contract.getScore(target));
  }

  async getAuditedCount(): Promise<number> {
    return Number(await this.contract.getAuditedCount());
  }

  async listenForRequests(
    callback: (target: string, requester: string) => void
  ): Promise<void> {
    // Use polling instead of contract.on() — HTTP RPCs don't support eth_newFilter
    const provider = this.signer.provider!;
    this.lastBlock = await provider.getBlockNumber();
    console.log(`Polling for AuditRequested events from block ${this.lastBlock}`);

    this.pollTimer = setInterval(async () => {
      try {
        const currentBlock = await provider.getBlockNumber();
        if (currentBlock <= this.lastBlock) return;

        const events = await this.contract.queryFilter(
          this.contract.filters.AuditRequested(),
          this.lastBlock + 1,
          currentBlock
        );

        for (const event of events) {
          const args = (event as ethers.EventLog).args;
          if (args) callback(args[0], args[1]);
        }

        this.lastBlock = currentBlock;
      } catch {
        // Silently skip — transient RPC errors are expected
      }
    }, POLL_INTERVAL_MS);
  }

  stopListening(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  get address(): string {
    return this.signer.address;
  }
}
