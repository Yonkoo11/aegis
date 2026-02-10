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
    // Filter out unverified "Unknown" contracts
    let result = reports.filter(r => r.contractName && r.contractName !== 'Unknown Contract' && r.contractName !== 'Unknown');

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

    <div class="sort-wrap">
      <select bind:value={sortBy} class="sort-select">
        <option value="newest">Newest</option>
        <option value="score">Highest Risk</option>
        <option value="name">Name A-Z</option>
      </select>
      <svg class="sort-chevron" width="12" height="12" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
      </svg>
    </div>

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
    <div class="contracts-grid animate-fade-in">
      {#each Array(6) as _}
        <div class="skeleton-card">
          <div class="skeleton-line skeleton-name"></div>
          <div class="skeleton-line skeleton-addr"></div>
          <div class="skeleton-line skeleton-meta"></div>
        </div>
      {/each}
    </div>
  {:else if filtered.length === 0}
    <div class="empty-state animate-fade-in">
      <p class="empty-text">
        {reports.length === 0 ? 'No contracts scanned yet.' : 'No contracts match your filters.'}
      </p>
    </div>
  {:else}
    <div class="contracts-grid animate-fade-in-delay-2">
      {#each filtered as report, i}
        <div class="card-stagger" style="animation-delay: {Math.min(i * 50, 500)}ms;">
          <ContractCard {report} />
        </div>
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

  .sort-wrap {
    position: relative;
  }

  .sort-select {
    appearance: none;
    -webkit-appearance: none;
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: var(--radius-sm);
    padding: 8px 32px 8px 12px;
    font-family: var(--f-mono);
    font-size: 0.8125rem;
    color: var(--c-text);
    outline: none;
    cursor: pointer;
    transition: border-color var(--dur-fast) var(--ease-out);
  }

  .sort-chevron {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--c-muted);
    pointer-events: none;
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

  /* Card stagger entrance */
  .card-stagger {
    opacity: 0;
    transform: translateY(12px);
    animation: card-enter 0.4s var(--ease-out) forwards;
  }
  @keyframes card-enter {
    to { opacity: 1; transform: translateY(0); }
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

  /* Skeleton cards */
  .skeleton-card {
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: var(--radius-md);
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .skeleton-line {
    border-radius: 4px;
    background: linear-gradient(90deg, var(--c-secondary) 25%, var(--c-border) 50%, var(--c-secondary) 75%);
    background-size: 200% 100%;
    animation: skeleton-shimmer 1.5s ease infinite;
  }

  .skeleton-name {
    width: 60%;
    height: 16px;
  }

  .skeleton-addr {
    width: 45%;
    height: 12px;
  }

  .skeleton-meta {
    width: 80%;
    height: 12px;
    margin-top: 8px;
  }

  @keyframes skeleton-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
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
