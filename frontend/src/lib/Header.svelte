<script lang="ts">
  import { currentPath } from './router';

  let path = '/';
  currentPath.subscribe(p => { path = p; });

  let navOpen = false;

  function toggleNav() {
    navOpen = !navOpen;
  }

  function closeNav() {
    navOpen = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && navOpen) closeNav();
  }

  function navTo(href: string) {
    closeNav();
    window.location.hash = href;
  }

  const links = [
    { href: '/', label: 'Scan', index: '01' },
    { href: '/explore', label: 'Explorer', index: '02' },
    { href: '/stats', label: 'Stats', index: '03' },
  ];
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Top bar -->
<header class="topbar">
  <a href="#/" class="logo-link">
    <div class="logo-icon">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--c-primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="logo-svg">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    </div>
    <span class="logo-text">Aegis</span>
  </a>

  <!-- Status indicator -->
  <div class="status-indicator">
    <span class="status-dot"></span>
    BSC Mainnet
  </div>

  <!-- Hamburger trigger -->
  <button
    on:click={toggleNav}
    class="hamburger"
    aria-label={navOpen ? 'Close navigation' : 'Open navigation'}
    aria-expanded={navOpen}
  >
    <span class="hamburger-line" class:open-top={navOpen}></span>
    <span class="hamburger-line" class:open-mid={navOpen}></span>
    <span class="hamburger-line" class:open-bot={navOpen}></span>
  </button>
</header>

<!-- Overlay navigation -->
<div
  class="nav-overlay"
  class:nav-visible={navOpen}
  aria-hidden={!navOpen}
>
  <nav class="nav-inner">
    <div class="nav-label">Navigation</div>

    {#each links as link, i}
      <button
        on:click={() => navTo(link.href)}
        class="nav-link"
        style="transition-delay: {navOpen ? 80 * (i + 1) : 0}ms;"
        class:nav-link-visible={navOpen}
        tabindex={navOpen ? 0 : -1}
      >
        <span class="nav-index">{link.index}</span>
        {link.label}
      </button>
    {/each}

    <div class="nav-footer">
      Decentralized AI Security Oracle<br/>
      BNB Chain // Onchain Verified
    </div>
  </nav>
</div>

<style>
  .topbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: var(--z-sticky);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--sp-4) var(--sp-6);
    background: rgba(10, 10, 15, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--c-border);
  }

  .logo-link {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
    text-decoration: none;
  }

  .logo-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: 2px solid var(--c-primary);
    border-radius: var(--radius-sm);
  }

  .logo-svg {
    filter: drop-shadow(0 0 4px var(--c-primary-glow));
  }

  .logo-text {
    font-family: var(--f-display);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--c-text-bright);
    letter-spacing: -0.02em;
  }

  .status-indicator {
    font-family: var(--f-mono);
    font-size: 0.6875rem;
    color: var(--c-success);
    display: flex;
    align-items: center;
    gap: var(--sp-2);
  }

  .status-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--c-success);
    animation: pulse-glow 2s ease-out infinite;
  }

  /* Hamburger */
  .hamburger {
    display: flex;
    flex-direction: column;
    gap: 5px;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: calc(var(--z-nav) + 1);
    padding: var(--sp-3);
    min-width: 44px;
    min-height: 44px;
    background: none;
    border: none;
    cursor: pointer;
  }

  .hamburger-line {
    display: block;
    width: 24px;
    height: 2px;
    background: var(--c-text);
    transform-origin: center;
    transition: transform var(--dur-normal) var(--ease-out),
                opacity var(--dur-normal) var(--ease-out);
  }

  .hamburger-line.open-top {
    transform: translateY(7px) rotate(45deg);
  }

  .hamburger-line.open-mid {
    opacity: 0;
  }

  .hamburger-line.open-bot {
    transform: translateY(-7px) rotate(-45deg);
  }

  /* Overlay */
  .nav-overlay {
    position: fixed;
    inset: 0;
    z-index: var(--z-nav);
    display: flex;
    align-items: center;
    background: var(--c-surface-overlay);
    opacity: 0;
    visibility: hidden;
    transition: opacity var(--dur-normal) var(--ease-out),
                visibility var(--dur-normal) var(--ease-out);
  }

  .nav-overlay.nav-visible {
    opacity: 1;
    visibility: visible;
  }

  .nav-inner {
    width: 100%;
    padding: var(--sp-16) var(--sp-6);
  }

  .nav-label {
    font-family: var(--f-mono);
    font-size: 0.6875rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--c-muted);
    margin-bottom: var(--sp-4);
    padding-left: var(--sp-2);
  }

  .nav-link {
    display: block;
    width: 100%;
    text-align: left;
    font-family: var(--f-display);
    font-weight: 700;
    font-size: clamp(2rem, 5vw, 4rem);
    color: var(--c-text);
    padding: var(--sp-3) var(--sp-2);
    border: none;
    border-left: 3px solid transparent;
    background: none;
    cursor: pointer;
    min-height: 44px;
    transform: translateX(-20px);
    opacity: 0;
    transition: transform var(--dur-normal) var(--ease-out),
                opacity var(--dur-normal) var(--ease-out),
                color var(--dur-fast) var(--ease-out),
                border-left-color var(--dur-fast) var(--ease-out);
  }

  .nav-link.nav-link-visible {
    transform: translateX(0);
    opacity: 1;
  }

  .nav-index {
    font-family: var(--f-mono);
    font-size: 0.8125rem;
    color: var(--c-muted);
    margin-right: var(--sp-4);
    vertical-align: super;
  }

  @media (hover: hover) {
    .nav-link:hover {
      color: var(--c-primary);
      border-left-color: var(--c-primary);
    }
  }

  .nav-link:focus-visible {
    color: var(--c-primary);
    border-left-color: var(--c-primary);
  }

  .nav-footer {
    font-family: var(--f-mono);
    font-size: 0.6875rem;
    line-height: 2;
    color: var(--c-muted);
    margin-top: var(--sp-16);
    padding-left: var(--sp-2);
  }
</style>
