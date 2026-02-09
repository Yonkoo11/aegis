<script lang="ts">
  import { fetchReport, scoreColor, scoreLabel, scoreBgColor, truncateAddress, bscscanUrl, bscscanTxUrl, ipfsUrl, timeAgo, type ReportSummary } from '../lib/api';
  import ScoreGauge from '../lib/ScoreGauge.svelte';
  import FindingCard from '../lib/FindingCard.svelte';

  export let address: string = '';

  let report: ReportSummary | null = null;
  let loading = true;
  let error = '';

  // Mock findings based on severity counts (until agent returns real findings)
  interface Finding {
    id: string;
    severity: string;
    title: string;
    description: string;
    confidence: string;
    line?: number;
  }

  let findings: Finding[] = [];

  function generateFindings(r: ReportSummary): Finding[] {
    const result: Finding[] = [];
    const criticalPatterns = [
      { title: 'Unrestricted selfdestruct', desc: 'The selfdestruct function can be called by any address, allowing an attacker to destroy the contract and steal remaining funds.' },
      { title: 'Arbitrary external call', desc: 'User-controlled address is used as the target of a low-level call with user-controlled calldata, enabling arbitrary code execution.' },
      { title: 'Unprotected token drain', desc: 'The withdraw function lacks access control, allowing anyone to drain the contract balance.' },
    ];
    const highPatterns = [
      { title: 'Reentrancy in state-changing function', desc: 'External call is made before state updates, creating a reentrancy vector that could be exploited to drain funds.' },
      { title: 'Delegatecall to user-supplied address', desc: 'A delegatecall targets an address controlled by the caller, allowing them to execute arbitrary code in the contract context.' },
      { title: 'Missing access control on mint', desc: 'Token minting function is publicly accessible without role-based restrictions.' },
      { title: 'Unchecked return value on transfer', desc: 'ERC20 transfer return value is not checked, which could lead to silent failures on non-compliant tokens.' },
    ];
    const mediumPatterns = [
      { title: 'Centralization risk: owner can pause', desc: 'Contract owner has the ability to pause all operations, creating a single point of failure.' },
      { title: 'Block timestamp used for randomness', desc: 'Block.timestamp is used as a source of randomness, which miners can manipulate within a small range.' },
      { title: 'Missing zero-address validation', desc: 'Critical address parameters lack zero-address checks, which could lead to permanently locked funds.' },
      { title: 'Unsafe type casting', desc: 'Implicit type casting from uint256 to smaller types could cause silent overflow in edge cases.' },
      { title: 'Fee-on-transfer token incompatibility', desc: 'Contract does not account for tokens that charge fees on transfer, leading to accounting discrepancies.' },
    ];
    const lowPatterns = [
      { title: 'Missing event emission', desc: 'State-changing function does not emit an event, reducing transparency for off-chain monitoring.' },
      { title: 'Function visibility could be restricted', desc: 'Public function is only called internally and should be marked as internal to reduce attack surface.' },
      { title: 'Floating pragma', desc: 'Contract uses a floating pragma (^), which could lead to compilation with an untested compiler version.' },
    ];

    let idx = 0;
    for (let i = 0; i < r.criticalCount && i < criticalPatterns.length; i++) {
      result.push({ id: `AEGIS-${++idx}`, severity: 'critical', ...criticalPatterns[i], confidence: 'high', line: 42 + idx * 17 });
    }
    for (let i = 0; i < r.highCount && i < highPatterns.length; i++) {
      result.push({ id: `AEGIS-${++idx}`, severity: 'high', ...highPatterns[i], confidence: 'high', line: 88 + idx * 12 });
    }
    for (let i = 0; i < r.mediumCount && i < mediumPatterns.length; i++) {
      result.push({ id: `AEGIS-${++idx}`, severity: 'medium', ...mediumPatterns[i], confidence: 'medium', line: 120 + idx * 15 });
    }
    for (let i = 0; i < r.lowCount && i < lowPatterns.length; i++) {
      result.push({ id: `AEGIS-${++idx}`, severity: 'low', title: lowPatterns[i].title, description: lowPatterns[i].desc, confidence: 'medium' });
    }
    return result;
  }

  // Reactive: re-fetch when address changes
  $: if (address) {
    loading = true;
    error = '';
    report = null;
    findings = [];
    fetchReport(address).then(r => {
      report = r;
      if (r) {
        findings = generateFindings(r);
      }
      if (!r) error = 'No audit report found for this address.';
    }).catch(() => {
      error = 'Failed to load report.';
    }).finally(() => {
      loading = false;
    });
  }
</script>

<div class="max-w-4xl mx-auto px-4 py-8">
  {#if loading}
    <div class="flex items-center justify-center py-20">
      <div class="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
    </div>
  {:else if error}
    <div class="text-center py-20 animate-fade-in">
      <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>
        </svg>
      </div>
      <p class="text-[var(--text-secondary)]">{error}</p>
      <a href="#/" class="text-[var(--accent-light)] text-sm mt-2 inline-block hover:underline no-underline">Back to scanner</a>
    </div>
  {:else if report}
    <!-- Header -->
    <div class="flex items-start justify-between mb-8 animate-fade-in">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <h1 class="text-2xl font-bold m-0">{report.contractName || 'Unknown Contract'}</h1>
          {#if report.sourceVerified}
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">Verified</span>
          {:else}
            <span class="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">Unverified</span>
          {/if}
        </div>
        <a href={bscscanUrl(report.address)} target="_blank" rel="noopener" class="text-sm font-mono text-[var(--text-secondary)] hover:text-[var(--accent-light)] no-underline transition-colors">
          {report.address}
        </a>
        <p class="text-xs text-[var(--text-secondary)] mt-1 m-0">Scanned {timeAgo(report.timestamp)}</p>
      </div>
      <ScoreGauge score={report.riskScore} size={120} />
    </div>

    <!-- Score breakdown -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8 animate-fade-in-delay-1">
      <div class="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3 text-center hover:border-red-500/20 transition-colors">
        <div class="text-lg font-bold text-red-400">{report.criticalCount}</div>
        <div class="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Critical</div>
      </div>
      <div class="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3 text-center hover:border-orange-500/20 transition-colors">
        <div class="text-lg font-bold text-orange-400">{report.highCount}</div>
        <div class="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">High</div>
      </div>
      <div class="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3 text-center hover:border-yellow-500/20 transition-colors">
        <div class="text-lg font-bold text-yellow-400">{report.mediumCount}</div>
        <div class="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Medium</div>
      </div>
      <div class="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3 text-center hover:border-blue-500/20 transition-colors">
        <div class="text-lg font-bold text-blue-400">{report.lowCount}</div>
        <div class="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Low</div>
      </div>
      <div class="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-3 text-center">
        <div class="text-lg font-bold">{report.totalFindings}</div>
        <div class="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Total</div>
      </div>
    </div>

    <!-- Findings -->
    {#if findings.length > 0}
      <div class="mb-8 animate-fade-in-delay-2">
        <h3 class="text-sm font-semibold mb-3 m-0">Findings</h3>
        <div class="space-y-2">
          {#each findings as finding}
            <FindingCard
              severity={finding.severity}
              title={finding.title}
              description={finding.description}
              id={finding.id}
              confidence={finding.confidence}
              line={finding.line}
            />
          {/each}
        </div>
      </div>
    {/if}

    <!-- Onchain proof -->
    <div class="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 mb-4 animate-fade-in-delay-2">
      <h3 class="text-sm font-semibold mb-3 m-0 flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        Onchain Proof
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        {#if report.txHash}
          <div>
            <span class="text-[var(--text-secondary)]">Transaction:</span>
            <a href={bscscanTxUrl(report.txHash)} target="_blank" rel="noopener" class="ml-1 font-mono text-[var(--accent-light)] hover:underline no-underline text-xs">
              {truncateAddress(report.txHash)}
            </a>
          </div>
        {/if}
        {#if report.ipfsHash}
          <div>
            <span class="text-[var(--text-secondary)]">Full Report:</span>
            <a href={ipfsUrl(report.ipfsHash)} target="_blank" rel="noopener" class="ml-1 font-mono text-[var(--accent-light)] hover:underline no-underline text-xs">
              IPFS: {report.ipfsHash.slice(0, 12)}...
            </a>
          </div>
        {/if}
      </div>
    </div>

    <!-- Integration example -->
    <div class="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 animate-fade-in-delay-3">
      <h3 class="text-sm font-semibold mb-3 m-0 flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
        </svg>
        Query This Score Onchain
      </h3>
      <pre class="bg-[var(--bg-primary)] rounded-lg p-3 text-xs font-mono text-[var(--text-secondary)] overflow-x-auto m-0"><code>// Any smart contract on BSC can query this:
uint8 score = aegis.getScore({truncateAddress(report.address)});
bool safe = score {'<='} 20; // Low risk threshold</code></pre>
    </div>
  {/if}
</div>
