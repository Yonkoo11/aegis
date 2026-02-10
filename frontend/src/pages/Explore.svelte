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

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(r =>
        r.address.toLowerCase().includes(q) ||
        r.contractName.toLowerCase().includes(q)
      );
    }

    if (filterRisk !== 'all') {
      result = result.filter(r => r.riskLevel === filterRisk);
    }

    if (sortBy === 'score') {
      result.sort((a, b) => b.riskScore - a.riskScore);
    } else if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.contractName.localeCompare(b.contractName));
    }

    filtered = result;
  }

  const riskFilters = [
    { key: 'all', label: 'All', color: 'var(--c-primary)' },
    { key: 'critical', label: 'Critical', color: 'var(--sev-critical)' },
    { key: 'high', label: 'High', color: 'var(--sev-high)' },
    { key: 'medium', label: 'Medium', color: 'var(--sev-medium)' },
    { key: 'low', label: 'Low', color: 'var(--sev-low)' },
  ];
</script>

<div class="explore-page">
  <!-- Header -->
  <div class="page-header animate-fade-in">
    <div class="section-label">Explorer</div>
    <h1 class="page-title">Audited Contracts</h1>
    <p class="page-subtitle">{reports.length} contracts scanned on BNB Chain</p>
  </div>

  <!-- Filters -->
  <div class="filter-bar animate-fade-in-delay-1">
    <div class="search-wrap">
      <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
      </svg>
      <label for="explore-search" class="sr-only">Search contracts</label>
      <input
        id="explore-search"
        bind:value={search}
        type="text"
        placeholder="Search address or name..."
        class="search-input"
      />
    </div>

    <select bind:value={sortBy} class="sort-select">
      <option value="newest">Newest</option>
      <option value="score">Highest Risk</option>
      <option value="name">Name A-Z</option>
    </select>

    <div class="risk-filters">
      {#each riskFilters as rf}
        <button
          on:click={() => filterRisk = rf.key}
          class="risk-btn"
          class:active={filterRisk === rf.key}
          style="{filterRisk === rf.key ? `color: ${rf.color}; border-color: ${rf.color}; background: ${rf.color}15;` : ''}"
        >
          {rf.label}
        </button>
      {/each}
    </div>
  </div>

  <!-- Results -->
  {#if loading}
    <div class="loading-state">
      <div class="scan-line-loader"></div>
    </div>
  {:else if filtered.length === 0}
    <div class="empty-state animate-fade-in">
      <p class="empty-text">
        {reports.length === 0 ? 'No contracts scanned yet.' : 'No contracts match your filters.'}
      </p>
    </div>
  {:else}
    <div class="contracts-grid animate-fade-in-delay-2">
      {#each filtered as report}
        <ContractCard {report} />
      {/each}
    </div>
    <div class="results-count">
      Showing {filtered.length} of {reports.length} contracts
    </div>
  {/if}
</div>

<style>
  .explore-page {
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

  /* Filters */
  .filter-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
  }

  .search-wrap {
    flex: 1;
    min-width: 200px;
    position: relative;
  }

  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--c-muted);
  }

  .search-input {
    width: 100%;
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: var(--radius-sm);
    padding: 8px 12px 8px 36px;
    font-family: var(--f-mono);
    font-size: 1rem;
    color: var(--c-text);
    outline: none;
    caret-color: var(--c-primary);
    transition: border-color var(--dur-fast) var(--ease-out);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .search-input::placeholder {
    color: var(--c-muted);
    opacity: 0.5;
  }

  .search-input:focus {
    border-color: var(--c-border-active);
  }

  .sort-select {
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: var(--radius-sm);
    padding: 8px 36px 8px 12px;
    font-family: var(--f-mono);
    font-size: 0.8125rem;
    color: var(--c-text);
    outline: none;
    cursor: pointer;
    transition: border-color var(--dur-fast) var(--ease-out);
  }

  .sort-select:focus {
    border-color: var(--c-border-active);
  }

  .risk-filters {
    display: flex;
    gap: 4px;
  }

  .risk-btn {
    padding: 6px 12px;
    font-family: var(--f-mono);
    font-size: 0.6875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border: 1px solid var(--c-border);
    border-radius: var(--radius-sm);
    background: var(--c-surface);
    color: var(--c-muted);
    cursor: pointer;
    transition: color var(--dur-fast) var(--ease-out),
                border-color var(--dur-fast) var(--ease-out),
                background var(--dur-fast) var(--ease-out);
    min-height: 36px;
  }

  @media (hover: hover) {
    .risk-btn:hover {
      border-color: var(--c-border-active);
    }
  }

  /* Grid */
  .contracts-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 12px;
  }

  @media (min-width: 640px) {
    .contracts-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 1024px) {
    .contracts-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .results-count {
    text-align: center;
    font-family: var(--f-mono);
    font-size: 0.6875rem;
    color: var(--c-muted);
    margin-top: 24px;
    padding-bottom: 32px;
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

  @media (max-width: 640px) {
    .filter-bar {
      flex-direction: column;
      align-items: stretch;
    }

    .risk-filters {
      flex-wrap: wrap;
    }
  }
</style>
