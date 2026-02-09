<script lang="ts">
  import { scoreColor, truncateAddress, timeAgo } from './api';
  import type { ReportSummary } from './api';

  export let report: ReportSummary;
</script>

<a
  href="#/report/{report.address}"
  class="block border border-[var(--border)] rounded-lg p-4 transition-all hover:bg-[var(--bg-card-hover)] hover:border-[var(--accent)]/30 bg-[var(--bg-card)] no-underline"
>
  <div class="flex items-center justify-between">
    <div class="min-w-0">
      <div class="flex items-center gap-2">
        <span class="font-semibold text-sm">{report.contractName || 'Unknown'}</span>
        {#if report.sourceVerified}
          <span class="text-[10px] px-1 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">Verified</span>
        {:else}
          <span class="text-[10px] px-1 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">Unverified</span>
        {/if}
      </div>
      <p class="text-xs text-[var(--text-secondary)] font-mono mt-1 m-0">{truncateAddress(report.address)}</p>
    </div>
    <div class="text-right shrink-0 ml-4">
      <div class="text-2xl font-bold {scoreColor(report.riskScore)}">{report.riskScore}</div>
      <div class="text-[10px] text-[var(--text-secondary)] uppercase">{report.riskLevel}</div>
    </div>
  </div>

  <div class="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--border)]">
    <span class="text-[10px] text-[var(--text-secondary)]">{report.totalFindings} findings</span>
    {#if report.criticalCount > 0}
      <span class="text-[10px] text-red-400">{report.criticalCount}C</span>
    {/if}
    {#if report.highCount > 0}
      <span class="text-[10px] text-orange-400">{report.highCount}H</span>
    {/if}
    {#if report.mediumCount > 0}
      <span class="text-[10px] text-yellow-400">{report.mediumCount}M</span>
    {/if}
    {#if report.lowCount > 0}
      <span class="text-[10px] text-blue-400">{report.lowCount}L</span>
    {/if}
    <span class="ml-auto text-[10px] text-[var(--text-secondary)]">{timeAgo(report.timestamp)}</span>
  </div>
</a>
