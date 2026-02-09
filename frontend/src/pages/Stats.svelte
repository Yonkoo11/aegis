<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchAllReports, scoreBgColor, type ReportSummary } from '../lib/api';

  let reports: ReportSummary[] = [];
  let loading = true;

  // Computed stats
  let totalScanned = 0;
  let avgScore = 0;
  let distribution = { low: 0, medium: 0, high: 0, critical: 0 };
  let topVulnTypes: { name: string; count: number; color: string }[] = [];
  let verifiedPct = 0;
  let totalFindings = 0;

  onMount(async () => {
    try {
      reports = await fetchAllReports();
      computeStats();
    } catch {}
    loading = false;
  });

  function computeStats() {
    totalScanned = reports.length;
    if (totalScanned === 0) return;

    avgScore = Math.round(reports.reduce((s, r) => s + r.riskScore, 0) / totalScanned);

    for (const r of reports) {
      if (r.riskScore <= 20) distribution.low++;
      else if (r.riskScore <= 50) distribution.medium++;
      else if (r.riskScore <= 75) distribution.high++;
      else distribution.critical++;
    }

    const verified = reports.filter(r => r.sourceVerified).length;
    verifiedPct = Math.round((verified / totalScanned) * 100);

    let critTotal = reports.reduce((s, r) => s + r.criticalCount, 0);
    let highTotal = reports.reduce((s, r) => s + r.highCount, 0);
    let medTotal = reports.reduce((s, r) => s + r.mediumCount, 0);
    let lowTotal = reports.reduce((s, r) => s + r.lowCount, 0);
    totalFindings = critTotal + highTotal + medTotal + lowTotal;

    topVulnTypes = [
      { name: 'Critical', count: critTotal, color: '#ef4444' },
      { name: 'High', count: highTotal, color: '#f97316' },
      { name: 'Medium', count: medTotal, color: '#eab308' },
      { name: 'Low', count: lowTotal, color: '#3b82f6' },
    ].filter(v => v.count > 0);
  }
</script>

<div class="max-w-6xl mx-auto px-4 py-8">
  <h1 class="text-2xl font-bold mb-1 animate-fade-in">BSC Security Health</h1>
  <p class="text-sm text-[var(--text-secondary)] mb-8 animate-fade-in">Aggregated security metrics across {totalScanned} audited contracts</p>

  {#if loading}
    <div class="flex justify-center py-12">
      <div class="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
    </div>
  {:else if totalScanned === 0}
    <div class="text-center py-12 text-[var(--text-secondary)] animate-fade-in">No data yet. Scan some contracts first.</div>
  {:else}
    <!-- Overview cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-fade-in-delay-1">
      <div class="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 text-center hover:border-[var(--accent)]/20 transition-colors">
        <div class="text-3xl font-bold">{totalScanned}</div>
        <div class="text-xs text-[var(--text-secondary)] mt-1">Contracts Scanned</div>
      </div>
      <div class="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 text-center hover:border-[var(--accent)]/20 transition-colors">
        <div class="text-3xl font-bold" style="color: {scoreBgColor(avgScore)}; text-shadow: 0 0 24px {scoreBgColor(avgScore)}33">{avgScore}</div>
        <div class="text-xs text-[var(--text-secondary)] mt-1">Average Risk Score</div>
      </div>
      <div class="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 text-center hover:border-green-500/20 transition-colors">
        <div class="text-3xl font-bold text-green-400">{verifiedPct}%</div>
        <div class="text-xs text-[var(--text-secondary)] mt-1">Source Verified</div>
      </div>
      <div class="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 text-center hover:border-red-500/20 transition-colors">
        <div class="text-3xl font-bold text-red-400">{distribution.critical + distribution.high}</div>
        <div class="text-xs text-[var(--text-secondary)] mt-1">High Risk Contracts</div>
      </div>
    </div>

    <!-- Distribution -->
    <div class="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 mb-8 animate-fade-in-delay-2">
      <h3 class="text-sm font-semibold mb-4 m-0">Risk Distribution</h3>
      <div class="space-y-3">
        {#each [
          { label: 'Low Risk (0-20)', count: distribution.low, color: '#22c55e' },
          { label: 'Medium Risk (21-50)', count: distribution.medium, color: '#eab308' },
          { label: 'High Risk (51-75)', count: distribution.high, color: '#f97316' },
          { label: 'Critical Risk (76-100)', count: distribution.critical, color: '#ef4444' },
        ] as bar}
          <div>
            <div class="flex justify-between text-xs mb-1">
              <span class="text-[var(--text-secondary)]">{bar.label}</span>
              <span class="font-medium" style="color: {bar.color}">{bar.count} <span class="text-[var(--text-secondary)] font-normal">/ {totalScanned}</span></span>
            </div>
            <div class="h-2.5 bg-[var(--bg-primary)] rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-700 ease-out"
                style="width: {totalScanned > 0 ? (bar.count / totalScanned) * 100 : 0}%; background: {bar.color}; box-shadow: 0 0 8px {bar.color}44"
              ></div>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Finding types -->
    {#if topVulnTypes.length > 0}
      <div class="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 animate-fade-in-delay-3">
        <h3 class="text-sm font-semibold mb-4 m-0">Findings by Severity <span class="text-[var(--text-secondary)] font-normal ml-1">({totalFindings} total)</span></h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          {#each topVulnTypes as vuln}
            <div class="text-center p-3 rounded-lg bg-[var(--bg-primary)]">
              <div class="text-2xl font-bold" style="color: {vuln.color}">{vuln.count}</div>
              <div class="text-xs text-[var(--text-secondary)] mt-1">{vuln.name}</div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>
