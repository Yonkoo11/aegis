<script lang="ts">
  import { scoreColor, scoreBgColor, truncateAddress, timeAgo } from './api';
  import type { ReportSummary } from './api';

  export let report: ReportSummary;
</script>

<a
  href="#/report/{report.address}"
  class="card"
>
  <!-- Top accent line -->
  <div class="card-accent" style="background: linear-gradient(90deg, transparent, {scoreBgColor(report.riskScore)}, transparent);"></div>

  <div class="card-inner">
    <div class="card-header">
      <div class="card-info">
        <div class="card-name-row">
          <span class="card-name">{report.contractName || 'Unknown'}</span>
          {#if report.sourceVerified}
            <span class="verify-badge verified">Verified</span>
          {:else}
            <span class="verify-badge unverified">Unverified</span>
          {/if}
        </div>
        <p class="card-address">{truncateAddress(report.address)}</p>
      </div>
      <div class="card-score">
        <span class="score-value {scoreColor(report.riskScore)}" style="text-shadow: 0 0 20px {scoreBgColor(report.riskScore)}44">{report.riskScore}</span>
        <span class="score-risk">{report.riskLevel}</span>
      </div>
    </div>

    <div class="card-footer">
      <span class="finding-count">{report.totalFindings} findings</span>
      <div class="severity-counts">
        {#if report.criticalCount > 0}
          <span class="sev-count" style="color: var(--sev-critical);">{report.criticalCount}C</span>
        {/if}
        {#if report.highCount > 0}
          <span class="sev-count" style="color: var(--sev-high);">{report.highCount}H</span>
        {/if}
        {#if report.mediumCount > 0}
          <span class="sev-count" style="color: var(--sev-medium);">{report.mediumCount}M</span>
        {/if}
        {#if report.lowCount > 0}
          <span class="sev-count" style="color: var(--sev-low);">{report.lowCount}L</span>
        {/if}
      </div>
      <span class="card-time">{timeAgo(report.timestamp)}</span>
    </div>
  </div>
</a>

<style>
  .card {
    display: block;
    position: relative;
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: var(--radius-md);
    overflow: hidden;
    text-decoration: none;
    transition: transform var(--dur-fast) var(--ease-out),
                border-color var(--dur-fast) var(--ease-out),
                box-shadow var(--dur-fast) var(--ease-out);
  }

  @media (hover: hover) {
    .card:hover {
      border-color: var(--c-border-active);
      transform: translateY(-2px);
      box-shadow: var(--shadow-card);
    }

    .card:hover .card-name {
      color: var(--c-primary);
    }
  }

  .card-accent {
    height: 1px;
    opacity: 0.5;
  }

  .card-inner {
    padding: 16px;
  }

  .card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .card-info {
    min-width: 0;
  }

  .card-name-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .card-name {
    font-family: var(--f-display);
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--c-text);
    transition: color var(--dur-fast) var(--ease-out);
  }

  .verify-badge {
    font-family: var(--f-mono);
    font-size: 0.55rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 1px 6px;
    border-radius: var(--radius-sm);
  }

  .verify-badge.verified {
    color: var(--c-success);
    background: rgba(0, 255, 136, 0.1);
    border: 1px solid rgba(0, 255, 136, 0.2);
  }

  .verify-badge.unverified {
    color: var(--c-error);
    background: rgba(255, 51, 68, 0.1);
    border: 1px solid rgba(255, 51, 68, 0.2);
  }

  .card-address {
    font-family: var(--f-mono);
    font-size: 0.6875rem;
    color: var(--c-muted);
    margin: 4px 0 0;
  }

  .card-score {
    text-align: right;
    flex-shrink: 0;
  }

  .score-value {
    font-family: var(--f-display);
    font-size: 1.75rem;
    font-weight: 700;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .score-risk {
    display: block;
    font-family: var(--f-mono);
    font-size: 0.55rem;
    color: var(--c-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-top: 2px;
  }

  .card-footer {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--c-border);
  }

  .finding-count {
    font-family: var(--f-mono);
    font-size: 0.6rem;
    color: var(--c-muted);
  }

  .severity-counts {
    display: flex;
    gap: 8px;
  }

  .sev-count {
    font-family: var(--f-mono);
    font-size: 0.6rem;
    font-weight: 600;
  }

  .card-time {
    font-family: var(--f-mono);
    font-size: 0.6rem;
    color: var(--c-muted);
    margin-left: auto;
  }
</style>
