/**
 * Scan queue with FIFO ordering and rate limiting.
 * Prevents spam and manages concurrent scan requests.
 */

export interface QueueItem {
  address: string;
  requestedAt: number;
  status: "pending" | "processing" | "completed" | "failed";
  error?: string;
}

const MAX_QUEUE_SIZE = 10;
const MIN_INTERVAL_MS = 12_000; // 5 scans per minute max
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24h cooldown for re-scans

export class ScanQueue {
  private queue: QueueItem[] = [];
  private processing = false;
  private lastScanTime = 0;
  private recentScans: Map<string, number> = new Map(); // address -> timestamp
  private processCallback?: (address: string) => Promise<void>;

  constructor(onProcess: (address: string) => Promise<void>) {
    this.processCallback = onProcess;
  }

  /**
   * Add an address to the scan queue.
   * Returns: the queue item status, or an error string.
   */
  enqueue(address: string, force = false): { ok: boolean; message: string; position?: number } {
    const normalized = address.toLowerCase();

    // Check cooldown (unless force re-scan)
    if (!force) {
      const lastScan = this.recentScans.get(normalized);
      if (lastScan && Date.now() - lastScan < COOLDOWN_MS) {
        return { ok: false, message: "Already scanned in last 24h. Use force=true to re-scan." };
      }
    }

    // Check if already in queue
    const existing = this.queue.find(
      (q) => q.address.toLowerCase() === normalized && q.status !== "completed" && q.status !== "failed"
    );
    if (existing) {
      const position = this.queue.filter((q) => q.status === "pending").indexOf(existing) + 1;
      return { ok: true, message: "Already in queue", position };
    }

    // Check queue capacity
    const pendingCount = this.queue.filter((q) => q.status === "pending").length;
    if (pendingCount >= MAX_QUEUE_SIZE) {
      return { ok: false, message: "Queue is full. Try again later." };
    }

    const item: QueueItem = {
      address: normalized,
      requestedAt: Date.now(),
      status: "pending",
    };
    this.queue.push(item);

    // Start processing if not already
    this.processNext();

    const position = this.queue.filter((q) => q.status === "pending").length;
    return { ok: true, message: "Added to queue", position };
  }

  getStatus(address: string): QueueItem | undefined {
    const normalized = address.toLowerCase();
    // Return most recent entry for this address
    return [...this.queue].reverse().find(
      (q) => q.address.toLowerCase() === normalized
    );
  }

  getQueueState(): { pending: number; processing: number; total: number } {
    return {
      pending: this.queue.filter((q) => q.status === "pending").length,
      processing: this.queue.filter((q) => q.status === "processing").length,
      total: this.queue.length,
    };
  }

  markScanned(address: string): void {
    this.recentScans.set(address.toLowerCase(), Date.now());
  }

  private async processNext(): Promise<void> {
    if (this.processing) return;
    if (!this.processCallback) return;

    const next = this.queue.find((q) => q.status === "pending");
    if (!next) return;

    // Rate limiting
    const now = Date.now();
    const elapsed = now - this.lastScanTime;
    if (elapsed < MIN_INTERVAL_MS) {
      setTimeout(() => this.processNext(), MIN_INTERVAL_MS - elapsed);
      return;
    }

    this.processing = true;
    next.status = "processing";
    this.lastScanTime = Date.now();

    try {
      await this.processCallback(next.address);
      next.status = "completed";
      this.markScanned(next.address);
    } catch (error) {
      next.status = "failed";
      next.error = error instanceof Error ? error.message : "Unknown error";
    } finally {
      this.processing = false;
      // Clean up old completed/failed items (keep last 50)
      if (this.queue.length > 50) {
        this.queue = this.queue.slice(-50);
      }
      // Process next in queue
      this.processNext();
    }
  }
}
