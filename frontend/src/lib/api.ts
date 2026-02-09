/**
 * API client for the Aegis agent backend.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

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

export interface ScanResponse {
  status: 'completed' | 'queued' | 'processing';
  message?: string;
  position?: number;
  estimatedTime?: string;
  report?: ReportSummary;
  error?: string;
}

export interface StatusResponse {
  status: 'completed' | 'pending' | 'processing' | 'failed' | 'unknown';
  report?: ReportSummary;
  error?: string;
}

export async function fetchAllReports(): Promise<ReportSummary[]> {
  const res = await fetch(`${API_BASE}/reports.json`);
  if (!res.ok) return [];
  return res.json();
}

export async function fetchReport(address: string): Promise<ReportSummary | null> {
  const res = await fetch(`${API_BASE}/report/${address}`);
  if (!res.ok) return null;
  return res.json();
}

export async function requestScan(address: string, force = false): Promise<ScanResponse> {
  const res = await fetch(`${API_BASE}/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, force }),
  });
  return res.json();
}

export async function checkStatus(address: string): Promise<StatusResponse> {
  const res = await fetch(`${API_BASE}/status/${address}`);
  return res.json();
}

export function scoreColor(score: number): string {
  if (score <= 20) return 'score-low';
  if (score <= 50) return 'score-medium';
  if (score <= 75) return 'score-high';
  return 'score-critical';
}

export function scoreLabel(score: number): string {
  if (score <= 20) return 'Low Risk';
  if (score <= 50) return 'Medium Risk';
  if (score <= 75) return 'High Risk';
  return 'Critical Risk';
}

export function scoreBgColor(score: number): string {
  if (score <= 20) return '#22c55e';
  if (score <= 50) return '#eab308';
  if (score <= 75) return '#f97316';
  return '#ef4444';
}

export function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function ipfsUrl(hash: string): string {
  if (!hash) return '';
  return `https://gateway.pinata.cloud/ipfs/${hash}`;
}

export function bscscanUrl(address: string): string {
  return `https://bscscan.com/address/${address}`;
}

export function bscscanTxUrl(hash: string): string {
  if (!hash) return '';
  return `https://bscscan.com/tx/${hash}`;
}

export function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
