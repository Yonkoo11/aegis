<script lang="ts">
  import { navigate } from '../lib/router';
  import { fetchAllReports, requestScan, checkStatus, scoreColor, type ReportSummary } from '../lib/api';
  import ContractCard from '../lib/ContractCard.svelte';
  import { onMount, tick } from 'svelte';

  let address = '';
  let scanning = false;
  let scanMessage = '';
  let scanError = '';
  let recentReports: ReportSummary[] = [];
  let stats = { total: 0, avgScore: 0, threats: 0 };
  let pollInterval: ReturnType<typeof setInterval> | null = null;

  let revealObserver: IntersectionObserver;

  function setupRevealObserver() {
    if (revealObserver) return;
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed');
          revealObserver.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
  }

  function observeReveals() {
    document.querySelectorAll('.reveal:not(.revealed)').forEach(el => {
      revealObserver.observe(el);
    });
  }

  onMount(async () => {
    setupRevealObserver();

    try {
      recentReports = await fetchAllReports();
      if (recentReports.length > 0) {
        stats.total = recentReports.length;
        stats.avgScore = Math.round(recentReports.reduce((s, r) => s + r.riskScore, 0) / recentReports.length);
        stats.threats = recentReports.filter(r => r.riskScore > 50).length;
      }
    } catch {}

    // Observe initial elements
    observeReveals();

    // Re-observe after conditional blocks render
    await tick();
    observeReveals();
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

  function scrollToHero() {
    document.getElementById('scan-address')?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
</script>

<!-- ==================== SECTION 1: HERO ==================== -->
<section class="hero">
  <div class="scan-line"></div>
  <div class="grid-pattern"></div>
  <div class="hero-particles">
    {#each Array(12) as _, i}
      <div class="particle" style="left: {[15,45,70,85,25,55,10,80,35,60,90,5][i]}%; top: {[20,35,15,55,65,75,80,30,50,10,70,45][i]}%; animation-delay: {[0,1.2,0.6,2.4,1.8,3,0.3,2.1,3.6,4.2,1.5,4.8][i]}s;"></div>
    {/each}
  </div>
  <div class="hero-glow hero-glow--primary"></div>
  <div class="hero-glow hero-glow--accent"></div>

  <div class="hero-content">
    <div class="hero-grid">
      <div class="animate-fade-in">
        <div class="hero-tagline"><span>Decentralized Security Oracle</span></div>
        <h1 class="hero-title">Audit<br/><span class="title-accent">Onchain</span></h1>
        <p class="hero-subtitle">
          AI-powered security audits for every smart contract on BNB Chain.
          Results stored onchain. Queryable by any dApp.
        </p>
      </div>

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
        <button on:click={handleScan} disabled={scanning} class="scan-btn">
          {#if scanning}
            <span class="scan-spinner"></span>Scanning...
          {:else}
            Execute Scan
          {/if}
        </button>
        {#if scanError}
          <div id="scan-error" class="scan-error" role="alert">{scanError}</div>
        {/if}
        {#if scanning && scanMessage}
          <div class="scan-status"><span class="scan-status-dot"></span>{scanMessage}</div>
        {/if}
      </div>
    </div>

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

<!-- ==================== SECTION 2: HOW IT WORKS ==================== -->
<section class="section reveal">
  <div class="section-inner">
    <div class="section-label">How It Works</div>
    <h2 class="section-title">Three steps to a security score</h2>
    <div class="steps-grid">
      <div class="step-card reveal-child" style="transition-delay: 0ms;">
        <div class="step-number">01</div>
        <div class="step-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--c-primary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </div>
        <h3 class="step-name">Paste Address</h3>
        <p class="step-desc">Drop any BSC contract address into the scanner. Verified source code is fetched automatically from BSCScan.</p>
      </div>

      <div class="step-connector">
        <div class="connector-line"></div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--c-muted)" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>

      <div class="step-card reveal-child" style="transition-delay: 150ms;">
        <div class="step-number">02</div>
        <div class="step-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--c-primary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93"/><path d="M8.56 9.8A3.99 3.99 0 0 1 8 8a4 4 0 0 1 .67-2.22"/><circle cx="12" cy="16" r="4"/><path d="M12 12v1"/><path d="M15.5 17.5 17 19"/><path d="M8.5 17.5 7 19"/>
          </svg>
        </div>
        <h3 class="step-name">AI Analyzes</h3>
        <p class="step-desc">40+ static patterns scan for known vulnerabilities. Then Claude AI performs deep contextual analysis on the source code.</p>
      </div>

      <div class="step-connector">
        <div class="connector-line"></div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--c-muted)" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </div>

      <div class="step-card reveal-child" style="transition-delay: 300ms;">
        <div class="step-number">03</div>
        <div class="step-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--c-primary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>
        <h3 class="step-name">Results Onchain</h3>
        <p class="step-desc">Risk score and findings hash are written to the SecurityOracle contract. Full report pinned to IPFS. Permanent and queryable.</p>
      </div>
    </div>
  </div>
</section>

<div class="section-divider"></div>
<!-- ==================== SECTION 3: WHY AEGIS ==================== -->
<section class="section section--alt reveal">
  <div class="section-inner">
    <div class="section-label">Why Aegis</div>
    <h2 class="section-title">Not just a tool. Infrastructure.</h2>
    <div class="features-grid">
      <div class="feature-card reveal-child" style="border-top-color: var(--c-primary); transition-delay: 0ms;">
        <div class="feature-icon" style="color: var(--c-primary);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93"/><path d="M8.56 9.8A3.99 3.99 0 0 1 8 8a4 4 0 0 1 .67-2.22"/><circle cx="12" cy="16" r="4"/><path d="M12 12v1"/>
          </svg>
        </div>
        <h3 class="feature-name">AI-Powered Analysis</h3>
        <p class="feature-desc">Goes beyond pattern matching. Claude AI reads the source code and identifies logic bugs, access control flaws, and economic attack vectors that static tools miss.</p>
      </div>
      <div class="feature-card reveal-child" style="border-top-color: var(--c-success); transition-delay: 100ms;">
        <div class="feature-icon" style="color: var(--c-success);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
        </div>
        <h3 class="feature-name">Onchain Oracle</h3>
        <p class="feature-desc">Any dApp on BNB Chain can call <code>getScore()</code> before interacting with an unknown contract. Security as a composable primitive.</p>
      </div>
      <div class="feature-card reveal-child" style="border-top-color: var(--c-accent); transition-delay: 200ms;">
        <div class="feature-icon" style="color: var(--c-accent);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
        </div>
        <h3 class="feature-name">IPFS Persistence</h3>
        <p class="feature-desc">Full audit reports are pinned to IPFS via Pinata. Immutable, permanent, and censorship-resistant. The score lives onchain; the details live on IPFS.</p>
      </div>
    </div>
  </div>
</section>

<div class="section-divider"></div>
<!-- ==================== SECTION 4: INTEGRATION CODE ==================== -->
<section class="section reveal">
  <div class="section-inner">
    <div class="section-label">For Developers</div>
    <div class="code-section">
      <div class="code-text">
        <h2 class="section-title">Integrate in 3 lines</h2>
        <p class="code-subtitle">Your smart contract can query Aegis before interacting with unknown contracts. Add a security gate in seconds.</p>
        <div class="code-meta">
          <span class="code-meta-item">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--c-success)" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            View function (no gas cost)
          </span>
          <span class="code-meta-item">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--c-success)" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            Works from any BSC contract
          </span>
          <span class="code-meta-item">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--c-success)" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            Verified on BSCScan
          </span>
        </div>
      </div>
      <div class="code-block-wrap reveal-child">
        <div class="code-block-header">
          <span class="code-lang">Solidity</span>
          <span class="code-file">MyDeFiProtocol.sol</span>
        </div>
        <pre class="code-block"><code><span class="c-keyword">interface</span> <span class="c-type">IAegis</span> {'{'}
    <span class="c-keyword">function</span> <span class="c-fn">getScore</span>(<span class="c-type">address</span>) <span class="c-keyword">external</span> <span class="c-keyword">view</span> <span class="c-keyword">returns</span> (<span class="c-type">uint8</span>);
{'}'}

<span class="c-type">IAegis</span> <span class="c-keyword">constant</span> aegis = <span class="c-type">IAegis</span>(<span class="c-string">0x6D88...1F8f</span>);

<span class="c-keyword">function</span> <span class="c-fn">deposit</span>(<span class="c-type">address</span> vault) <span class="c-keyword">external</span> {'{'}
    <span class="c-type">uint8</span> score = aegis.<span class="c-fn">getScore</span>(vault);
    <span class="c-keyword">require</span>(score {'<='} <span class="c-num">20</span>, <span class="c-string">"Risk too high"</span>);
    <span class="c-comment">// Your dApp is now security-aware</span>
{'}'}</code></pre>
      </div>
    </div>
  </div>
</section>

<div class="section-divider"></div>
<!-- ==================== SECTION 5: RECENT SCANS ==================== -->
{#if recentReports.length > 0}
  <section class="section section--alt reveal">
    <div class="section-inner">
      <div class="section-label">Live Data</div>
      <h2 class="section-title">{stats.total} contracts scanned and counting</h2>
      <div class="contracts-grid">
        {#each recentReports.slice(0, 6) as report, i}
          <div class="reveal-child" style="transition-delay: {i * 80}ms;">
            <ContractCard {report} />
          </div>
        {/each}
      </div>
      <div class="section-cta-row">
        <a href="#/explore" class="view-all-link">View all scanned contracts</a>
      </div>
    </div>
  </section>
{/if}

<div class="section-divider"></div>
<!-- ==================== SECTION 6: CTA BANNER ==================== -->
<section class="section reveal">
  <div class="section-inner">
    <div class="cta-banner">
      <div class="cta-grid-bg"></div>
      <div class="cta-glow cta-glow--primary"></div>
      <div class="cta-glow cta-glow--accent"></div>
      <div class="cta-content">
        <h2 class="cta-title">Secure your protocol</h2>
        <p class="cta-desc">Paste any BSC contract address. Get an instant AI security audit. Free, permissionless, onchain.</p>
        <button on:click={scrollToHero} class="cta-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Start Scanning
        </button>
      </div>
    </div>
  </div>
</section>

<style>
  /* ===== SCROLL REVEAL ===== */
  .reveal {
    opacity: 0;
    transform: translateY(40px);
    transition: opacity 0.7s ease-out, transform 0.7s ease-out;
  }
  :global(.reveal.revealed) {
    opacity: 1;
    transform: translateY(0);
  }
  .reveal-child {
    opacity: 0;
    transform: translateY(24px);
    transition: opacity 0.5s ease-out, transform 0.5s ease-out;
  }
  :global(.revealed) .reveal-child {
    opacity: 1;
    transform: translateY(0);
  }

  /* ===== HERO ===== */
  .hero {
    position: relative;
    min-height: min(85vh, 820px);
    display: flex;
    align-items: center;
    padding: 80px 24px 48px;
    overflow: hidden;
  }

  .scan-line {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent 0%, var(--c-primary) 20%, var(--c-primary) 80%, transparent 100%);
    opacity: 0.6;
    animation: scan-line 4s var(--ease-out) infinite;
    z-index: 1;
    box-shadow: 0 0 20px var(--c-primary-glow), 0 0 60px var(--c-primary-dim);
  }

  .grid-pattern {
    position: absolute; inset: 0;
    background-image: linear-gradient(var(--c-border) 1px, transparent 1px), linear-gradient(90deg, var(--c-border) 1px, transparent 1px);
    background-size: 60px 60px;
    opacity: 0.4;
    mask-image: radial-gradient(ellipse 80% 70% at 40% 60%, black 0%, transparent 100%);
    -webkit-mask-image: radial-gradient(ellipse 80% 70% at 40% 60%, black 0%, transparent 100%);
  }

  .hero-particles { position: absolute; inset: 0; overflow: hidden; z-index: 1; }
  .particle {
    position: absolute; width: 2px; height: 2px;
    background: var(--c-primary); border-radius: 50%;
    opacity: 0; animation: particle-float 6s var(--ease-out) infinite;
  }
  @keyframes particle-float {
    0% { opacity: 0; transform: translateY(0) scale(1); }
    20% { opacity: 0.8; }
    100% { opacity: 0; transform: translateY(-120px) scale(0); }
  }

  .hero-glow { position: absolute; border-radius: 50%; filter: blur(120px); z-index: 1; }
  .hero-glow--primary { width: 500px; height: 500px; background: var(--c-primary); bottom: -10%; left: -5%; opacity: 0.12; }
  .hero-glow--accent { width: 300px; height: 300px; background: var(--c-accent); top: 10%; right: -10%; opacity: 0.08; }

  .hero-content { position: relative; z-index: 10; max-width: 1320px; width: 100%; margin: 0 auto; }
  .hero-grid { display: grid; grid-template-columns: 1fr; gap: 48px; }
  @media (min-width: 768px) {
    .hero-grid { grid-template-columns: 1.2fr 0.8fr; align-items: center; gap: 32px; }
  }

  .hero-tagline {
    font-family: var(--f-mono); font-size: 0.6875rem; color: var(--c-primary);
    text-transform: uppercase; letter-spacing: 0.2em; margin-bottom: 24px;
    display: flex; align-items: center; gap: 12px;
  }
  .hero-tagline::before { content: '>'; color: var(--c-accent); }

  .hero-title {
    font-family: var(--f-display); font-size: clamp(2.75rem, 6vw, 5.5rem);
    font-weight: 700; color: var(--c-text-bright); line-height: 1.05;
    margin-bottom: 24px; letter-spacing: -0.03em;
  }
  .title-accent { color: var(--c-primary); text-shadow: 0 0 30px var(--c-primary-glow); animation: text-glow 3s ease-out infinite alternate; }
  @keyframes text-glow {
    0% { text-shadow: 0 0 20px var(--c-primary-glow); }
    100% { text-shadow: 0 0 40px var(--c-primary-glow), 0 0 80px rgba(0, 240, 255, 0.1); }
  }

  .hero-subtitle { font-family: var(--f-body); font-size: 1.5rem; color: var(--c-muted); max-width: 480px; line-height: 1.5; }

  /* Terminal */
  .scan-terminal { background: var(--c-surface); border: 1px solid var(--c-border); border-radius: var(--radius-md); padding: 24px; position: relative; }
  .scan-terminal::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, var(--c-primary), transparent); opacity: 0.5; }
  .scan-terminal-header { font-family: var(--f-mono); font-size: 0.6875rem; color: var(--c-muted); margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; }
  .scan-prompt { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
  .prompt-symbol { font-family: var(--f-mono); font-size: 0.8125rem; color: var(--c-primary); flex-shrink: 0; }
  .scan-input { flex: 1; background: transparent; border: none; font-family: var(--f-mono); font-size: 1rem; color: var(--c-text); outline: none; caret-color: var(--c-primary); }
  .scan-input::placeholder { color: var(--c-muted); opacity: 0.5; }
  .scan-input:disabled { opacity: 0.5; }
  .scan-btn {
    width: 100%; padding: 12px; background: var(--c-primary-dim); border: 1px solid var(--c-border-active);
    border-radius: var(--radius-sm); font-family: var(--f-display); font-size: 0.8125rem; font-weight: 600;
    color: var(--c-primary); text-transform: uppercase; letter-spacing: 0.1em; cursor: pointer;
    transition: background var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out);
    display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px;
  }
  @media (hover: hover) { .scan-btn:hover:not(:disabled) { background: rgba(0, 240, 255, 0.25); box-shadow: var(--shadow-glow-primary); } }
  .scan-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .scan-spinner { width: 14px; height: 14px; border: 2px solid var(--c-primary); border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .scan-error { font-family: var(--f-mono); font-size: 0.6875rem; color: var(--c-error); margin-top: 12px; padding: 8px 12px; background: rgba(255, 51, 68, 0.08); border: 1px solid rgba(255, 51, 68, 0.2); border-radius: var(--radius-sm); }
  .scan-status { font-family: var(--f-mono); font-size: 0.6875rem; color: var(--c-primary); margin-top: 12px; display: flex; align-items: center; gap: 8px; }
  .scan-status-dot { width: 6px; height: 6px; background: var(--c-primary); border-radius: 50%; animation: pulse-glow 2s ease-out infinite; }

  /* Hero stats */
  .hero-stats { display: flex; align-items: center; gap: 24px; margin-top: 40px; padding-top: 24px; border-top: 1px solid var(--c-border); }
  .hero-stat { display: flex; align-items: baseline; gap: 8px; }
  .hero-stat-value { font-family: var(--f-display); font-size: 1.5rem; font-weight: 700; color: var(--c-text-bright); font-variant-numeric: tabular-nums; }
  .hero-stat-label { font-family: var(--f-mono); font-size: 0.6rem; color: var(--c-muted); text-transform: uppercase; letter-spacing: 0.08em; }
  .hero-stat-divider { width: 1px; height: 24px; background: var(--c-border); }

  /* ===== SECTION DIVIDERS ===== */
  .section-divider {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--c-primary), transparent);
    opacity: 0.15;
  }

  /* ===== SECTION UTILITIES ===== */
  .section { position: relative; padding: 80px 24px; overflow: hidden; }
  .section--alt { /* transparent to let body gradient show */ }

  /* Per-section glow orbs for depth */
  .section::before {
    content: '';
    position: absolute;
    border-radius: 50%;
    filter: blur(120px);
    pointer-events: none;
    z-index: 0;
  }
  .section:nth-of-type(2)::before { width: 500px; height: 400px; background: var(--c-primary); top: -10%; left: -10%; opacity: 0.05; }
  .section:nth-of-type(3)::before { width: 400px; height: 400px; background: var(--c-accent); top: 20%; right: -5%; opacity: 0.04; }
  .section:nth-of-type(4)::before { width: 600px; height: 400px; background: var(--c-primary); bottom: -15%; left: 30%; opacity: 0.04; }
  .section:nth-of-type(5)::before { width: 400px; height: 300px; background: var(--c-accent); top: 10%; left: -10%; opacity: 0.03; }
  .section:nth-of-type(6)::before { width: 500px; height: 400px; background: var(--c-primary); top: -20%; right: -10%; opacity: 0.04; }
  .section-inner { max-width: 1320px; margin: 0 auto; position: relative; z-index: 1; }
  .section-label {
    font-family: var(--f-mono); font-size: 0.6875rem; color: var(--c-muted);
    text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 16px;
    display: flex; align-items: center; gap: 12px;
  }
  .section-label::before { content: ''; display: block; width: 12px; height: 1px; background: var(--c-primary); }
  .section-title { font-family: var(--f-display); font-size: clamp(1.5rem, 3vw, 2.25rem); font-weight: 700; color: var(--c-text-bright); margin: 0 0 40px; letter-spacing: -0.02em; }

  /* ===== HOW IT WORKS ===== */
  .steps-grid { display: flex; align-items: flex-start; gap: 0; }
  .step-card { flex: 1; padding: 24px; }
  .step-number { font-family: var(--f-mono); font-size: 0.6rem; color: var(--c-primary); letter-spacing: 0.1em; margin-bottom: 16px; opacity: 0.6; }
  .step-icon { margin-bottom: 16px; opacity: 0.8; }
  .step-name { font-family: var(--f-display); font-size: 1.125rem; font-weight: 600; color: var(--c-text-bright); margin-bottom: 8px; }
  .step-desc { font-family: var(--f-body); font-size: 0.875rem; color: var(--c-muted); line-height: 1.6; margin: 0; }
  .step-connector { display: flex; align-items: center; gap: 0; padding-top: 56px; color: var(--c-muted); }
  .connector-line { width: 24px; height: 1px; background: var(--c-border); }

  /* ===== FEATURES ===== */
  .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .feature-card {
    background: var(--c-surface); border: 1px solid var(--c-border); border-top: 2px solid var(--c-border);
    border-radius: var(--radius-md); padding: 28px; transition: border-color var(--dur-fast) var(--ease-out);
  }
  @media (hover: hover) { .feature-card:hover { border-color: var(--c-border-active); } }
  .feature-icon { margin-bottom: 16px; }
  .feature-name { font-family: var(--f-display); font-size: 1.0625rem; font-weight: 600; color: var(--c-text-bright); margin-bottom: 8px; }
  .feature-desc { font-family: var(--f-body); font-size: 0.8125rem; color: var(--c-muted); line-height: 1.65; margin: 0; }
  .feature-desc code { font-family: var(--f-mono); font-size: 0.75rem; color: var(--c-primary); background: var(--c-primary-dim); padding: 1px 5px; border-radius: 3px; }

  /* ===== CODE SECTION ===== */
  .code-section { display: grid; grid-template-columns: 1fr 1.2fr; gap: 40px; align-items: center; }
  .code-subtitle { font-family: var(--f-body); font-size: 1rem; color: var(--c-muted); line-height: 1.6; margin: 0 0 24px; }
  .code-meta { display: flex; flex-direction: column; gap: 8px; }
  .code-meta-item { font-family: var(--f-mono); font-size: 0.6875rem; color: var(--c-muted); display: flex; align-items: center; gap: 8px; }
  .code-block-wrap { background: var(--c-surface); border: 1px solid var(--c-border); border-radius: var(--radius-md); overflow: hidden; }
  .code-block-header { display: flex; justify-content: space-between; padding: 10px 16px; border-bottom: 1px solid var(--c-border); }
  .code-lang { font-family: var(--f-mono); font-size: 0.6rem; color: var(--c-primary); text-transform: uppercase; letter-spacing: 0.1em; }
  .code-file { font-family: var(--f-mono); font-size: 0.6rem; color: var(--c-muted); }
  .code-block { margin: 0; padding: 20px; font-family: var(--f-mono); font-size: 0.75rem; line-height: 1.8; overflow-x: auto; color: var(--c-muted); }
  .code-block :global(.c-keyword) { color: var(--c-primary); }
  .code-block :global(.c-type) { color: var(--c-accent); }
  .code-block :global(.c-fn) { color: var(--c-text-bright); }
  .code-block :global(.c-string) { color: var(--c-success); }
  .code-block :global(.c-num) { color: var(--sev-medium); }
  .code-block :global(.c-comment) { color: var(--c-muted); opacity: 0.5; font-style: italic; }

  /* ===== RECENT SCANS ===== */
  .contracts-grid { display: grid; grid-template-columns: repeat(1, 1fr); gap: 12px; }
  @media (min-width: 640px) { .contracts-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 1024px) { .contracts-grid { grid-template-columns: repeat(3, 1fr); } }
  .section-cta-row { text-align: center; margin-top: 32px; }
  .view-all-link { font-family: var(--f-mono); font-size: 0.6875rem; color: var(--c-primary); text-transform: uppercase; letter-spacing: 0.1em; transition: opacity var(--dur-fast) var(--ease-out); }
  @media (hover: hover) { .view-all-link:hover { opacity: 0.7; } }

  /* ===== CTA BANNER ===== */
  .cta-banner {
    position: relative; background: var(--c-surface); border-radius: var(--radius-md);
    padding: 64px 40px; text-align: center; overflow: hidden;
    border: 1px solid rgba(0, 240, 255, 0.1);
    animation: cta-border-pulse 4s ease-in-out infinite;
  }
  @keyframes cta-border-pulse {
    0%, 100% { border-color: rgba(0, 240, 255, 0.1); }
    50% { border-color: rgba(0, 240, 255, 0.25); }
  }
  .cta-grid-bg {
    position: absolute; inset: 0;
    background-image: radial-gradient(circle, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 20px 20px;
    pointer-events: none;
  }
  .cta-glow {
    position: absolute; border-radius: 50%; filter: blur(120px); pointer-events: none;
  }
  .cta-glow--primary {
    width: 500px; height: 300px; background: var(--c-primary);
    top: -40%; left: 20%; opacity: 0.08;
    animation: cta-drift-1 8s ease-in-out infinite;
  }
  .cta-glow--accent {
    width: 400px; height: 250px; background: var(--c-accent);
    bottom: -30%; right: 10%; opacity: 0.05;
    animation: cta-drift-2 10s ease-in-out infinite;
  }
  @keyframes cta-drift-1 {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(30px, 15px); }
  }
  @keyframes cta-drift-2 {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(-20px, -10px); }
  }
  .cta-content { position: relative; z-index: 1; }
  .cta-title { font-family: var(--f-display); font-size: clamp(1.5rem, 3vw, 2.25rem); font-weight: 700; color: var(--c-text-bright); margin: 0 0 12px; }
  .cta-desc { font-family: var(--f-body); font-size: 1rem; color: var(--c-muted); margin: 0 0 32px; max-width: 520px; margin-left: auto; margin-right: auto; }
  .cta-btn {
    display: inline-flex; align-items: center; gap: 8px; padding: 16px 40px;
    background: var(--c-primary-dim); border: 1px solid var(--c-primary);
    border-radius: var(--radius-sm); font-family: var(--f-display); font-size: 0.875rem;
    font-weight: 600; color: var(--c-primary); text-transform: uppercase; letter-spacing: 0.1em;
    cursor: pointer;
    transition: background var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out);
  }
  @media (hover: hover) {
    .cta-btn:hover {
      background: rgba(0, 240, 255, 0.2);
      box-shadow: 0 0 40px var(--c-primary-glow), 0 0 80px rgba(0, 240, 255, 0.1);
      transform: translateY(-1px);
    }
  }

  /* ===== RESPONSIVE ===== */
  @media (max-width: 768px) {
    .steps-grid { flex-direction: column; gap: 8px; }
    .step-connector { display: none; }
    .features-grid { grid-template-columns: 1fr; }
    .code-section { grid-template-columns: 1fr; }
    .cta-banner { padding: 40px 24px; }
  }

  @media (max-width: 640px) {
    .hero-stats { flex-wrap: wrap; gap: 16px; }
    .hero-stat-divider { display: none; }
  }
</style>
