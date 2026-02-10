<script lang="ts">
  import { navigate } from '../lib/router';
  import { fetchAllReports, requestScan, checkStatus, scoreColor, type ReportSummary } from '../lib/api';
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
    scanMessage = 'Initializing scan...';

    try {
      const result = await requestScan(trimmed);

      if (result.status === 'offline') {
        scanError = result.error || 'Agent offline. Run the Aegis agent to scan live contracts.';
        scanning = false;
        return;
      }

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
        scanMessage = 'AI agent analyzing contract...';
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

<!-- Hero: Immersive full-viewport -->
<section class="hero">
  <!-- Scan line sweep -->
  <div class="scan-line"></div>

  <!-- Grid pattern background -->
  <div class="grid-pattern"></div>

  <!-- Floating particles -->
  <div class="hero-particles">
    {#each Array(12) as _, i}
      <div class="particle" style="left: {[15,45,70,85,25,55,10,80,35,60,90,5][i]}%; top: {[20,35,15,55,65,75,80,30,50,10,70,45][i]}%; animation-delay: {[0,1.2,0.6,2.4,1.8,3,0.3,2.1,3.6,4.2,1.5,4.8][i]}s;"></div>
    {/each}
  </div>

  <!-- Asymmetric glow orbs -->
  <div class="hero-glow hero-glow--primary"></div>
  <div class="hero-glow hero-glow--accent"></div>

  <!-- Content -->
  <div class="hero-content">
    <div class="hero-grid">
      <!-- Left: Title -->
      <div class="animate-fade-in">
        <div class="hero-tagline">
          <span>Decentralized Security Oracle</span>
        </div>
        <h1 class="hero-title">
          Audit<br/><span class="title-accent">Onchain</span>
        </h1>
        <p class="hero-subtitle">
          AI-powered security audits for every smart contract on BNB Chain.
          Results stored onchain. Queryable by any dApp.
        </p>
      </div>

      <!-- Right: Terminal scanner -->
      <div class="scan-terminal animate-fade-in-delay-1">
        <div class="scan-terminal-header">
          <span>aegis://scan</span>
          <span style="color: var(--c-success);">ready</span>
        </div>

        <div class="scan-prompt">
          <label for="scan-address" class="prompt-symbol">$</label>
          <input
            id="scan-address"
            bind:value={address}
            on:keydown={handleKeydown}
            type="text"
            placeholder="0x... paste BSC contract address"
            class="scan-input"
            disabled={scanning}
            aria-describedby={scanError ? 'scan-error' : undefined}
          />
        </div>

        <button
          on:click={handleScan}
          disabled={scanning}
          class="scan-btn"
        >
          {#if scanning}
            <span class="scan-spinner"></span>
            Scanning...
          {:else}
            Execute Scan
          {/if}
        </button>

        {#if scanError}
          <div id="scan-error" class="scan-error" role="alert">{scanError}</div>
        {/if}
        {#if scanning && scanMessage}
          <div class="scan-status">
            <span class="scan-status-dot"></span>
            {scanMessage}
          </div>
        {/if}
      </div>
    </div>

    <!-- Social proof stats - above fold -->
    {#if stats.total > 0}
      <div class="hero-stats animate-fade-in-delay-2">
        <div class="hero-stat">
          <span class="hero-stat-value">{stats.total}</span>
          <span class="hero-stat-label">Contracts Scanned</span>
        </div>
        <div class="hero-stat-divider"></div>
        <div class="hero-stat">
          <span class="hero-stat-value {scoreColor(stats.avgScore)}">{stats.avgScore}</span>
          <span class="hero-stat-label">Avg Risk Score</span>
        </div>
        <div class="hero-stat-divider"></div>
        <div class="hero-stat">
          <span class="hero-stat-value" style="color: var(--sev-high);">{stats.threats}</span>
          <span class="hero-stat-label">High Risk Detected</span>
        </div>
      </div>
    {/if}
  </div>
</section>


<!-- Recent scans -->
{#if recentReports.length > 0}
  <section class="section" style="padding-top: 0; padding-bottom: var(--sp-20);">
    <div class="section-inner">
      <div class="section-label">Recent Scans</div>
      <div class="contracts-grid animate-fade-in-delay-3">
        {#each recentReports.slice(0, 6) as report}
          <ContractCard {report} />
        {/each}
      </div>
      <div class="text-center mt-[var(--sp-6)]">
        <a href="#/explore" class="view-all-link">View all scanned contracts</a>
      </div>
    </div>
  </section>
{/if}

<style>
  /* Hero */
  .hero {
    position: relative;
    min-height: min(100vh, 900px);
    display: flex;
    align-items: center;
    padding: 80px 24px 48px;
    overflow: hidden;
    background: var(--c-secondary);
  }

  .scan-line {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent 0%, var(--c-primary) 20%, var(--c-primary) 80%, transparent 100%);
    opacity: 0.6;
    animation: scan-line 4s var(--ease-out) infinite;
    z-index: 1;
    box-shadow: 0 0 20px var(--c-primary-glow), 0 0 60px var(--c-primary-dim);
  }

  .grid-pattern {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(var(--c-border) 1px, transparent 1px),
      linear-gradient(90deg, var(--c-border) 1px, transparent 1px);
    background-size: 60px 60px;
    opacity: 0.3;
    mask-image: radial-gradient(ellipse 70% 60% at 30% 70%, black 0%, transparent 100%);
    -webkit-mask-image: radial-gradient(ellipse 70% 60% at 30% 70%, black 0%, transparent 100%);
  }

  .hero-particles {
    position: absolute;
    inset: 0;
    overflow: hidden;
    z-index: 1;
  }

  .particle {
    position: absolute;
    width: 2px;
    height: 2px;
    background: var(--c-primary);
    border-radius: 50%;
    opacity: 0;
    animation: particle-float 6s var(--ease-out) infinite;
  }

  @keyframes particle-float {
    0% { opacity: 0; transform: translateY(0) scale(1); }
    20% { opacity: 0.8; }
    100% { opacity: 0; transform: translateY(-120px) scale(0); }
  }

  .hero-glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(120px);
    z-index: 1;
  }

  .hero-glow--primary {
    width: 500px;
    height: 500px;
    background: var(--c-primary);
    bottom: -10%;
    left: -5%;
    opacity: 0.12;
  }

  .hero-glow--accent {
    width: 300px;
    height: 300px;
    background: var(--c-accent);
    top: 10%;
    right: -10%;
    opacity: 0.08;
  }

  .hero-content {
    position: relative;
    z-index: 10;
    max-width: 1320px;
    width: 100%;
    margin: 0 auto;
  }

  .hero-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 48px;
  }

  @media (min-width: 768px) {
    .hero-grid {
      grid-template-columns: 1.2fr 0.8fr;
      align-items: center;
      gap: 32px;
    }
  }

  .hero-tagline {
    font-family: var(--f-mono);
    font-size: 0.6875rem;
    color: var(--c-primary);
    text-transform: uppercase;
    letter-spacing: 0.2em;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .hero-tagline::before {
    content: '>';
    color: var(--c-accent);
  }

  .hero-title {
    font-family: var(--f-display);
    font-size: clamp(2.75rem, 6vw, 5.5rem);
    font-weight: 700;
    color: var(--c-text-bright);
    line-height: 1.05;
    margin-bottom: 24px;
    letter-spacing: -0.03em;
  }

  .title-accent {
    color: var(--c-primary);
    text-shadow: 0 0 30px var(--c-primary-glow);
    animation: text-glow 3s ease-out infinite alternate;
  }

  @keyframes text-glow {
    0% { text-shadow: 0 0 20px var(--c-primary-glow); }
    100% { text-shadow: 0 0 40px var(--c-primary-glow), 0 0 80px rgba(0, 240, 255, 0.1); }
  }

  .hero-subtitle {
    font-family: var(--f-body);
    font-size: 1.5rem;
    color: var(--c-muted);
    max-width: 480px;
    line-height: 1.5;
  }

  /* Terminal scanner */
  .scan-terminal {
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: var(--radius-md);
    padding: 24px;
    position: relative;
  }

  .scan-terminal::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--c-primary), transparent);
    opacity: 0.5;
  }

  .scan-terminal-header {
    font-family: var(--f-mono);
    font-size: 0.6875rem;
    color: var(--c-muted);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .scan-prompt {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .prompt-symbol {
    font-family: var(--f-mono);
    font-size: 0.8125rem;
    color: var(--c-primary);
    flex-shrink: 0;
  }

  .scan-input {
    flex: 1;
    background: transparent;
    border: none;
    font-family: var(--f-mono);
    font-size: 1rem;
    color: var(--c-text);
    outline: none;
    caret-color: var(--c-primary);
  }

  .scan-input::placeholder {
    color: var(--c-muted);
    opacity: 0.5;
  }

  .scan-input:disabled {
    opacity: 0.5;
  }

  .scan-btn {
    width: 100%;
    padding: 12px;
    background: var(--c-primary-dim);
    border: 1px solid var(--c-border-active);
    border-radius: var(--radius-sm);
    font-family: var(--f-display);
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--c-primary);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    cursor: pointer;
    transition: background var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 44px;
  }

  @media (hover: hover) {
    .scan-btn:hover:not(:disabled) {
      background: rgba(0, 240, 255, 0.25);
      box-shadow: var(--shadow-glow-primary);
    }
  }

  .scan-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .scan-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid var(--c-primary);
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .scan-error {
    font-family: var(--f-mono);
    font-size: 0.6875rem;
    color: var(--c-error);
    margin-top: 12px;
    padding: 8px 12px;
    background: rgba(255, 51, 68, 0.08);
    border: 1px solid rgba(255, 51, 68, 0.2);
    border-radius: var(--radius-sm);
  }

  .scan-status {
    font-family: var(--f-mono);
    font-size: 0.6875rem;
    color: var(--c-primary);
    margin-top: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .scan-status-dot {
    width: 6px;
    height: 6px;
    background: var(--c-primary);
    border-radius: 50%;
    animation: pulse-glow 2s ease-out infinite;
  }

  /* Hero inline stats */
  .hero-stats {
    display: flex;
    align-items: center;
    gap: 24px;
    margin-top: 40px;
    padding-top: 24px;
    border-top: 1px solid var(--c-border);
  }

  .hero-stat {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  .hero-stat-value {
    font-family: var(--f-display);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--c-text-bright);
    font-variant-numeric: tabular-nums;
  }

  .hero-stat-label {
    font-family: var(--f-mono);
    font-size: 0.6rem;
    color: var(--c-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .hero-stat-divider {
    width: 1px;
    height: 24px;
    background: var(--c-border);
  }

  /* Section utilities */
  .section {
    position: relative;
    padding: 96px 24px;
    overflow: hidden;
  }

  .section-inner {
    max-width: 1320px;
    margin: 0 auto;
  }

  .section-label {
    font-family: var(--f-mono);
    font-size: 0.6875rem;
    color: var(--c-muted);
    text-transform: uppercase;
    letter-spacing: 0.15em;
    margin-bottom: 24px;
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

  /* Contracts grid */
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

  .view-all-link {
    font-family: var(--f-mono);
    font-size: 0.6875rem;
    color: var(--c-primary);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    transition: opacity var(--dur-fast) var(--ease-out);
  }

  @media (hover: hover) {
    .view-all-link:hover {
      opacity: 0.7;
    }
  }

  @media (max-width: 640px) {
    .hero-stats {
      flex-wrap: wrap;
      gap: 16px;
    }

    .hero-stat-divider {
      display: none;
    }
  }
</style>
