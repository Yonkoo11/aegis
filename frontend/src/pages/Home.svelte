<script lang="ts">
  import { navigate } from '../lib/router';
  import { fetchAllReports, requestScan, checkStatus, scoreColor, type ReportSummary } from '../lib/api';
  import ScoreGauge from '../lib/ScoreGauge.svelte';
  import ContractCard from '../lib/ContractCard.svelte';
  import { onMount } from 'svelte';

  let address = '';
  let scanning = false;
  let scanMessage = '';
  let scanError = '';
  let recentReports: ReportSummary[] = [];
  let stats = { total: 0, avgScore: 0, threats: 0 };
  let pollInterval: ReturnType<typeof setInterval> | null = null;

  onMount(async () => {
    try {
      recentReports = await fetchAllReports();
      if (recentReports.length > 0) {
        stats.total = recentReports.length;
        stats.avgScore = Math.round(recentReports.reduce((s, r) => s + r.riskScore, 0) / recentReports.length);
        stats.threats = recentReports.filter(r => r.riskScore > 50).length;
      }
    } catch {}
  });

  async function handleScan() {
    const trimmed = address.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
      scanError = 'Enter a valid BSC contract address (0x...)';
      return;
    }

    scanError = '';
    scanning = true;
    scanMessage = 'Checking...';

    try {
      const result = await requestScan(trimmed);

      if (result.status === 'completed' && result.report) {
        navigate(`/report/${trimmed.toLowerCase()}`);
        return;
      }

      if (result.status === 'queued') {
        scanMessage = `Queued (position ${result.position}). ${result.estimatedTime}`;
        startPolling(trimmed);
      }
    } catch {
      scanError = 'Failed to reach the Aegis agent. Is it running?';
      scanning = false;
    }
  }

  function startPolling(addr: string) {
    pollInterval = setInterval(async () => {
      const status = await checkStatus(addr);
      if (status.status === 'completed') {
        stopPolling();
        navigate(`/report/${addr.toLowerCase()}`);
      } else if (status.status === 'failed') {
        stopPolling();
        scanError = status.error || 'Scan failed';
        scanning = false;
      } else if (status.status === 'processing') {
        scanMessage = 'AI agent is analyzing the contract...';
      }
    }, 5000);
  }

  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') handleScan();
  }
</script>

<div class="max-w-6xl mx-auto px-4">
  <!-- Hero -->
  <section class="pt-20 pb-16 text-center">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/20 mb-6">
      <div class="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-pulse"></div>
      <span class="text-xs text-[var(--accent-light)] font-medium">AI-Powered Security Oracle on BNB Chain</span>
    </div>

    <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-4">
      Is your contract <span class="text-[var(--accent-light)]">safe</span>?
    </h1>
    <p class="text-[var(--text-secondary)] text-lg max-w-xl mx-auto mb-8">
      Paste any BSC contract address. Get an instant AI security audit.<br/>
      Results stored onchain. Queryable by any dApp.
    </p>

    <!-- Search bar -->
    <div class="max-w-2xl mx-auto">
      <div class="flex gap-2">
        <input
          bind:value={address}
          on:keydown={handleKeydown}
          type="text"
          placeholder="0x... paste any BSC contract address"
          class="flex-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm font-mono text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/20 transition-all"
          disabled={scanning}
        />
        <button
          on:click={handleScan}
          disabled={scanning}
          class="px-6 py-3 bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white font-semibold text-sm rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {scanning ? 'Scanning...' : 'Scan'}
        </button>
      </div>

      {#if scanError}
        <p class="text-red-400 text-sm mt-2 text-left">{scanError}</p>
      {/if}
      {#if scanning && scanMessage}
        <div class="flex items-center gap-2 mt-3 text-sm text-[var(--accent-light)]">
          <div class="w-3 h-3 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
          {scanMessage}
        </div>
      {/if}
    </div>
  </section>

  <!-- Stats bar -->
  {#if stats.total > 0}
    <section class="grid grid-cols-3 gap-4 mb-12">
      <div class="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 text-center">
        <div class="text-2xl font-bold">{stats.total}</div>
        <div class="text-xs text-[var(--text-secondary)] mt-1">Contracts Scanned</div>
      </div>
      <div class="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 text-center">
        <div class="text-2xl font-bold {scoreColor(stats.avgScore)}">{stats.avgScore}</div>
        <div class="text-xs text-[var(--text-secondary)] mt-1">Average Score</div>
      </div>
      <div class="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 text-center">
        <div class="text-2xl font-bold text-red-400">{stats.threats}</div>
        <div class="text-xs text-[var(--text-secondary)] mt-1">High Risk Detected</div>
      </div>
    </section>
  {/if}

  <!-- Recent scans -->
  {#if recentReports.length > 0}
    <section class="pb-20">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold">Recent Scans</h2>
        <a href="#/explore" class="text-sm text-[var(--accent-light)] hover:underline no-underline">View all</a>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {#each recentReports.slice(0, 6) as report}
          <ContractCard {report} />
        {/each}
      </div>
    </section>
  {/if}
</div>
