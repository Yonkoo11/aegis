<script lang="ts">
  import { fetchReport, scoreColor, scoreLabel, scoreBgColor, truncateAddress, bscscanUrl, bscscanTxUrl, ipfsUrl, timeAgo, type ReportSummary } from '../lib/api';
  import ScoreGauge from '../lib/ScoreGauge.svelte';
  import FindingCard from '../lib/FindingCard.svelte';

  export let address: string = '';

  let report: ReportSummary | null = null;
  let loading = true;
  let error = '';

  // Reactive: re-fetch when address changes
  $: if (address) {
    loading = true;
    error = '';
    report = null;
    fetchReport(address).then(r => {
      report = r;
      if (!r) error = 'No audit report found for this address.';
    }).catch(() => {
      error = 'Failed to load report.';
    }).finally(() => {
      loading = false;
    });
  }
</script>

<div class="max-w-4xl mx-auto px-4 py-8">
  {#if loading}
    <div class="flex items-center justify-center py-20">
      <div class="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
    </div>
  {:else if error}
    <div class="text-center py-20">
      <p class="text-[var(--text-secondary)]">{error}</p>
      <a href="#/" class="text-[var(--accent-light)] text-sm mt-2 inline-block">Back to scanner</a>
    </div>
  {:else if report}
    <!-- Header -->
    <div class="flex items-start justify-between mb-8">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <h1 class="text-2xl font-bold m-0">{report.contractName || 'Unknown Contract'}</h1>
          {#if report.sourceVerified}
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">Verified</span>
          {:else}
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">Unverified</span>
          {/if}
        </div>
        <a href={bscscanUrl(report.address)} target="_blank" rel="noopener" class="text-sm font-mono text-[var(--text-secondary)] hover:text-[var(--accent-light)] no-underline">
          {report.address}
        </a>
        <p class="text-xs text-[var(--text-secondary)] mt-1 m-0">Scanned {timeAgo(report.timestamp)}</p>
      </div>
      <ScoreGauge score={report.riskScore} size={120} />
    </div>

    <!-- Score breakdown -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
      <div class="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3 text-center">
        <div class="text-lg font-bold text-red-400">{report.criticalCount}</div>
        <div class="text-[10px] text-[var(--text-secondary)] uppercase">Critical</div>
      </div>
      <div class="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3 text-center">
        <div class="text-lg font-bold text-orange-400">{report.highCount}</div>
        <div class="text-[10px] text-[var(--text-secondary)] uppercase">High</div>
      </div>
      <div class="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3 text-center">
        <div class="text-lg font-bold text-yellow-400">{report.mediumCount}</div>
        <div class="text-[10px] text-[var(--text-secondary)] uppercase">Medium</div>
      </div>
      <div class="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3 text-center">
        <div class="text-lg font-bold text-blue-400">{report.lowCount}</div>
        <div class="text-[10px] text-[var(--text-secondary)] uppercase">Low</div>
      </div>
      <div class="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3 text-center">
        <div class="text-lg font-bold">{report.totalFindings}</div>
        <div class="text-[10px] text-[var(--text-secondary)] uppercase">Total</div>
      </div>
    </div>

    <!-- Onchain proof -->
    <div class="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 mb-8">
      <h3 class="text-sm font-semibold mb-3 m-0">Onchain Proof</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        {#if report.txHash}
          <div>
            <span class="text-[var(--text-secondary)]">Transaction:</span>
            <a href={bscscanTxUrl(report.txHash)} target="_blank" rel="noopener" class="ml-1 font-mono text-[var(--accent-light)] hover:underline no-underline text-xs">
              {truncateAddress(report.txHash)}
            </a>
          </div>
        {/if}
        {#if report.ipfsHash}
          <div>
            <span class="text-[var(--text-secondary)]">Full Report:</span>
            <a href={ipfsUrl(report.ipfsHash)} target="_blank" rel="noopener" class="ml-1 font-mono text-[var(--accent-light)] hover:underline no-underline text-xs">
              IPFS: {report.ipfsHash.slice(0, 12)}...
            </a>
          </div>
        {/if}
      </div>
    </div>

    <!-- Integration example -->
    <div class="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4">
      <h3 class="text-sm font-semibold mb-3 m-0">Query This Score Onchain</h3>
      <pre class="bg-[var(--bg-primary)] rounded-lg p-3 text-xs font-mono text-[var(--text-secondary)] overflow-x-auto m-0"><code>// Any smart contract on BSC can query this:
uint8 score = aegis.getScore({truncateAddress(report.address)});
bool safe = score {'<='} 20; // Low risk threshold</code></pre>
    </div>
  {/if}
</div>
