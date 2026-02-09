<script lang="ts">
  export let severity: string;
  export let title: string;
  export let description: string;
  export let id: string;
  export let confidence: string = 'medium';
  export let line: number | undefined = undefined;

  const severityColors: Record<string, { bg: string; text: string; border: string }> = {
    critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
    high: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
    medium: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
    low: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    info: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/20' },
  };

  $: colors = severityColors[severity] || severityColors.info;

  let expanded = false;
</script>

<button
  class="w-full text-left border {colors.border} rounded-lg p-3 transition-colors hover:bg-[var(--bg-card-hover)] bg-[var(--bg-card)] cursor-pointer"
  on:click={() => expanded = !expanded}
>
  <div class="flex items-center justify-between gap-3">
    <div class="flex items-center gap-2 min-w-0">
      <span class="shrink-0 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded {colors.bg} {colors.text}">
        {severity}
      </span>
      <span class="font-medium text-sm truncate">{title}</span>
    </div>
    <div class="flex items-center gap-2 shrink-0">
      {#if line}
        <span class="text-[10px] text-[var(--text-secondary)]">L{line}</span>
      {/if}
      <span class="text-[10px] text-[var(--text-secondary)]">{confidence}</span>
      <svg class="w-4 h-4 text-[var(--text-secondary)] transition-transform" class:rotate-180={expanded} viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
      </svg>
    </div>
  </div>

  {#if expanded}
    <div class="mt-3 pt-3 border-t border-[var(--border)]">
      <p class="text-sm text-[var(--text-secondary)] leading-relaxed m-0">{description}</p>
      <p class="text-[10px] text-[var(--text-secondary)] mt-2 m-0 font-mono">{id}</p>
    </div>
  {/if}
</button>
