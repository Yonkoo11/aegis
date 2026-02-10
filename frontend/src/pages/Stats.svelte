<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchAllReports, scoreBgColor, type ReportSummary } from '../lib/api';

  let reports: ReportSummary[] = [];
  let loading = true;

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
      { name: 'Critical', count: critTotal, color: 'var(--sev-critical)' },
      { name: 'High', count: highTotal, color: 'var(--sev-high)' },
      { name: 'Medium', count: medTotal, color: 'var(--sev-medium)' },
      { name: 'Low', count: lowTotal, color: 'var(--sev-low)' },
    ].filter(v => v.count > 0);
  }

  const distBars = [
    { label: 'Low Risk', range: '0-20', key: 'low', color: 'var(--c-success)' },
    { label: 'Medium Risk', range: '21-50', key: 'medium', color: 'var(--sev-medium)' },
    { label: 'High Risk', range: '51-75', key: 'high', color: 'var(--sev-high)' },
    { label: 'Critical Risk', range: '76-100', key: 'critical', color: 'var(--sev-critical)' },
  ];
</script>

<div class="stats-page">
  <!-- Header -->
  <div class="page-header animate-fade-in">
    <div class="section-label">Dashboard</div>
    <h1 class="page-title">BSC Security Health</h1>
    <p class="page-subtitle">Aggregated security metrics across {totalScanned} audited contracts</p>
  </div>

  {#if loading}
    <div class="loading-state">
      <div class="scan-line-loader"></div>
    </div>
  {:else if totalScanned === 0}
    <div class="empty-state animate-fade-in">
      <p class="empty-text">No data yet. Scan some contracts first.</p>
    </div>
  {:else}
    <!-- Overview grid -->
    <div class="overview-grid animate-fade-in-delay-1">
      <div class="overview-card" style="--ov-accent: var(--c-primary);">
        <div class="ov-label">Contracts Scanned</div>
        <div class="ov-value">{totalScanned}</div>
      </div>
      <div class="overview-card" style="--ov-accent: {scoreBgColor(avgScore)};">
        <div class="ov-label">Average Risk Score</div>
        <div class="ov-value ov-value--tinted" style="color: {scoreBgColor(avgScore)};">{avgScore}</div>
      </div>
      <div class="overview-card" style="--ov-accent: var(--c-success);">
        <div class="ov-label">Source Verified</div>
        <div class="ov-value ov-value--tinted" style="color: var(--c-success);">{verifiedPct}%</div>
      </div>
      <div class="overview-card" style="--ov-accent: var(--sev-high);">
        <div class="ov-label">High Risk Contracts</div>
        <div class="ov-value ov-value--tinted" style="color: var(--sev-high);">{distribution.critical + distribution.high}</div>
      </div>
    </div>

    <!-- Risk distribution -->
    <div class="panel animate-fade-in-delay-2">
      <div class="section-label">Risk Distribution</div>
      <div class="dist-bars">
        {#each distBars as bar}
          <div class="dist-row">
            <div class="dist-header">
              <span class="dist-name">{bar.label} ({bar.range})</span>
              <span class="dist-count" style="color: {bar.color};">
                {distribution[bar.key]}
                <span class="dist-total">/ {totalScanned}</span>
              </span>
            </div>
            <div class="dist-track">
              <div
                class="dist-fill"
                style="width: {totalScanned > 0 ? (distribution[bar.key] / totalScanned) * 100 : 0}%; background: {bar.color}; box-shadow: 0 0 8px {bar.color}44;"
              ></div>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Findings by severity -->
    {#if topVulnTypes.length > 0}
      <div class="panel animate-fade-in-delay-3">
        <div class="section-label">
          Findings by Severity
          <span class="label-meta">{totalFindings} total</span>
        </div>
        <div class="vuln-bars">
          {#each topVulnTypes as vuln}
            <div class="vuln-bar-row">
              <div class="vuln-bar-label">
                <span class="vuln-bar-dot" style="background: {vuln.color}; box-shadow: 0 0 8px {vuln.color}44;"></span>
                <span class="vuln-bar-name">{vuln.name}</span>
              </div>
              <div class="vuln-bar-track">
                <div class="vuln-bar-fill" style="width: {totalFindings > 0 ? (vuln.count / totalFindings) * 100 : 0}%; background: {vuln.color}; box-shadow: 0 0 8px {vuln.color}44;"></div>
              </div>
              <span class="vuln-bar-count" style="color: {vuln.color};">{vuln.count}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .stats-page {
    max-width: 1320px;
    margin: 0 auto;
    padding: 96px 24px 80px;
  }

  .page-header {
    margin-bottom: 32px;
  }

  .section-label {
    font-family: var(--f-mono);
    font-size: 0.6875rem;
    color: var(--c-muted);
    text-transform: uppercase;
    letter-spacing: 0.15em;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .section-label::before {
    content: '';
    display: block;
    width: 12px;
    height: 1px;
    background: var(--c-primary);
  }

  .label-meta {
    font-weight: 400;
    opacity: 0.5;
  }

  .page-title {
    font-family: var(--f-display);
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--c-text-bright);
    margin: 0 0 4px;
  }

  .page-subtitle {
    font-family: var(--f-mono);
    font-size: 0.8125rem;
    color: var(--c-muted);
    margin: 0;
  }

  /* Overview */
  .overview-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 32px;
  }

  .overview-card {
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-top: 2px solid var(--ov-accent, var(--c-border));
    border-radius: var(--radius-md);
    padding: 20px 24px;
  }

  .ov-label {
    font-family: var(--f-mono);
    font-size: 0.6rem;
    color: var(--c-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 8px;
  }

  .ov-value {
    font-family: var(--f-display);
    font-size: 2.25rem;
    font-weight: 700;
    color: var(--c-text-bright);
    font-variant-numeric: tabular-nums;
  }

  /* Panel */
  .panel {
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: var(--radius-md);
    padding: 24px;
    margin-bottom: 16px;
  }

  /* Distribution bars */
  .dist-bars {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .dist-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .dist-name {
    font-family: var(--f-mono);
    font-size: 0.6875rem;
    color: var(--c-muted);
  }

  .dist-count {
    font-family: var(--f-mono);
    font-size: 0.6875rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  .dist-total {
    color: var(--c-muted);
    font-weight: 400;
  }

  .dist-track {
    height: 8px;
    background: var(--c-secondary);
    border-radius: 4px;
    overflow: hidden;
  }

  .dist-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.7s var(--ease-out);
  }

  /* Vuln bars */
  .vuln-bars {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .vuln-bar-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .vuln-bar-label {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 80px;
    flex-shrink: 0;
  }

  .vuln-bar-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .vuln-bar-name {
    font-family: var(--f-mono);
    font-size: 0.6875rem;
    color: var(--c-muted);
  }

  .vuln-bar-track {
    flex: 1;
    height: 24px;
    background: var(--c-secondary);
    border-radius: 4px;
    overflow: hidden;
  }

  .vuln-bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.7s var(--ease-out);
    min-width: 4px;
  }

  .vuln-bar-count {
    font-family: var(--f-mono);
    font-size: 0.875rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    min-width: 32px;
    text-align: right;
  }

  /* States */
  .loading-state {
    display: flex;
    justify-content: center;
    padding: 48px 0;
  }

  .scan-line-loader {
    width: 48px;
    height: 2px;
    background: var(--c-primary);
    border-radius: 1px;
    box-shadow: 0 0 12px var(--c-primary-glow);
    animation: loader-pulse 1.5s var(--ease-out) infinite;
  }

  @keyframes loader-pulse {
    0%, 100% { opacity: 0.3; transform: scaleX(0.5); }
    50% { opacity: 1; transform: scaleX(1); }
  }

  .empty-state {
    text-align: center;
    padding: 48px 0;
  }

  .empty-text {
    font-family: var(--f-body);
    color: var(--c-muted);
    margin: 0;
  }

  @media (max-width: 768px) {
    .overview-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 480px) {
    .overview-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
