<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchAllReports, type ReportSummary } from '../lib/api';
  import ContractCard from '../lib/ContractCard.svelte';

  let reports: ReportSummary[] = [];
  let filtered: ReportSummary[] = [];
  let loading = true;
  let search = '';
  let sortBy: 'score' | 'newest' | 'name' = 'newest';
  let filterRisk: 'all' | 'low' | 'medium' | 'high' | 'critical' = 'all';

  onMount(async () => {
    try {
      reports = await fetchAllReports();
    } catch {}
    loading = false;
  });

  $: {
    let result = [...reports];

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        r.address.toLowerCase().includes(q) ||
        r.contractName.toLowerCase().includes(q)
      );
    }

    // Risk filter
    if (filterRisk !== 'all') {
      result = result.filter(r => r.riskLevel === filterRisk);
    }

    // Sort
    if (sortBy === 'score') {
      result.sort((a, b) => b.riskScore - a.riskScore);
    } else if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.contractName.localeCompare(b.contractName));
    }

    filtered = result;
  }
</script>

<div class="max-w-6xl mx-auto px-4 py-8">
  <h1 class="text-2xl font-bold mb-1">Explorer</h1>
  <p class="text-sm text-[var(--text-secondary)] mb-6">{reports.length} contracts audited on BNB Chain</p>

  <!-- Filters -->
  <div class="flex flex-wrap items-center gap-3 mb-6">
    <input
      bind:value={search}
      type="text"
      placeholder="Search by address or name..."
      class="flex-1 min-w-[200px] bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:border-[var(--accent)]/50"
    />

    <select
      bind:value={sortBy}
      class="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none"
    >
      <option value="newest">Newest</option>
      <option value="score">Highest Risk</option>
      <option value="name">Name A-Z</option>
    </select>

    <div class="flex gap-1">
      {#each ['all', 'critical', 'high', 'medium', 'low'] as risk}
        <button
          on:click={() => filterRisk = risk}
          class="px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer
            {filterRisk === risk
              ? 'bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--accent-light)]'
              : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/20'}"
        >
          {risk === 'all' ? 'All' : risk.charAt(0).toUpperCase() + risk.slice(1)}
        </button>
      {/each}
    </div>
  </div>

  <!-- Results -->
  {#if loading}
    <div class="flex justify-center py-12">
      <div class="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
    </div>
  {:else if filtered.length === 0}
    <div class="text-center py-12 text-[var(--text-secondary)]">
      {reports.length === 0 ? 'No contracts scanned yet.' : 'No contracts match your filters.'}
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {#each filtered as report}
        <ContractCard {report} />
      {/each}
    </div>
  {/if}
</div>
