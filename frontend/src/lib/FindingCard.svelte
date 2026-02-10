<script lang="ts">
  export let severity: string;
  export let title: string;
  export let description: string;
  export let id: string;
  export let confidence: string = 'medium';
  export let line: number | undefined = undefined;

  const severityConfig: Record<string, { color: string; glow: string }> = {
    critical: { color: 'var(--sev-critical)', glow: 'rgba(255, 0, 102, 0.15)' },
    high: { color: 'var(--sev-high)', glow: 'rgba(255, 51, 68, 0.15)' },
    medium: { color: 'var(--sev-medium)', glow: 'rgba(255, 184, 0, 0.15)' },
    low: { color: 'var(--sev-low)', glow: 'rgba(0, 240, 255, 0.15)' },
    info: { color: 'var(--sev-info)', glow: 'rgba(90, 90, 110, 0.15)' },
  };

  $: config = severityConfig[severity] || severityConfig.info;

  let expanded = false;
</script>

<button
  class="finding-card"
  style="border-left-color: {config.color};"
  on:click={() => expanded = !expanded}
>
  <div class="finding-header">
    <div class="finding-left">
      <span class="severity-badge" style="color: {config.color}; background: {config.glow};">
        {severity}
      </span>
      <span class="finding-title">{title}</span>
    </div>
    <div class="finding-meta">
      {#if line}
        <span class="meta-tag">L{line}</span>
      {/if}
      <span class="meta-tag">{confidence}</span>
      <svg class="chevron" class:expanded viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
      </svg>
    </div>
  </div>

  {#if expanded}
    <div class="finding-detail">
      <p class="finding-desc">{description}</p>
      <p class="finding-id">{id}</p>
    </div>
  {/if}
</button>

<style>
  .finding-card {
    display: block;
    width: 100%;
    text-align: left;
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-left: 3px solid var(--c-muted);
    border-radius: var(--radius-sm);
    padding: 12px 16px;
    cursor: pointer;
    transition: background var(--dur-fast) var(--ease-out),
                border-color var(--dur-fast) var(--ease-out);
  }

  .finding-card:hover {
    background: var(--c-surface-raised);
  }

  .finding-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .finding-left {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .severity-badge {
    flex-shrink: 0;
    font-family: var(--f-mono);
    font-size: 0.6rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 2px 8px;
    border-radius: var(--radius-sm);
  }

  .finding-title {
    font-family: var(--f-display);
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--c-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .finding-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .meta-tag {
    font-family: var(--f-mono);
    font-size: 0.6rem;
    color: var(--c-muted);
    text-transform: uppercase;
  }

  .chevron {
    width: 16px;
    height: 16px;
    color: var(--c-muted);
    transition: transform var(--dur-fast) var(--ease-out);
  }

  .chevron.expanded {
    transform: rotate(180deg);
  }

  .finding-detail {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--c-border);
  }

  .finding-desc {
    font-family: var(--f-body);
    font-size: 0.875rem;
    color: var(--c-muted);
    line-height: 1.6;
    margin: 0;
  }

  .finding-id {
    font-family: var(--f-mono);
    font-size: 0.6rem;
    color: var(--c-muted);
    margin: 8px 0 0;
    opacity: 0.6;
  }
</style>
