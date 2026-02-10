<footer class="footer">
  <div class="footer-inner">
    <div class="footer-left">
      <div class="footer-brand">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--c-primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span>Aegis</span>
      </div>
      <span class="footer-copy">Decentralized AI Security Oracle on BNB Chain</span>
    </div>
    <div class="footer-links">
      <a href="https://testnet.bscscan.com/address/0x6d884cd49245161a6826aba46d5d6e95918a1f8f#code" target="_blank" rel="noopener">Contract</a>
      <a href="https://github.com/yonkoo11/aegis" target="_blank" rel="noopener">GitHub</a>
    </div>
  </div>
</footer>

<style>
  .footer {
    border-top: 1px solid var(--c-border);
    padding: 24px;
  }

  .footer-inner {
    max-width: 1320px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }

  .footer-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .footer-brand {
    display: flex;
    align-items: center;
    gap: 6px;
    font-family: var(--f-display);
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--c-text-bright);
  }

  .footer-copy {
    font-family: var(--f-mono);
    font-size: 0.625rem;
    color: var(--c-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .footer-links {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .footer-links a {
    font-family: var(--f-mono);
    font-size: 0.6875rem;
    color: var(--c-muted);
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    transition: color 0.15s ease;
  }

  .footer-links a:hover {
    color: var(--c-primary);
  }

  @media (max-width: 480px) {
    .footer-inner {
      flex-direction: column;
      text-align: center;
    }

    .footer-left {
      flex-direction: column;
      gap: 8px;
    }
  }
</style>
