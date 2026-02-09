<script lang="ts">
  import { currentPath } from './router';

  let path = '/';
  currentPath.subscribe(p => { path = p; });

  function isActive(href: string): boolean {
    if (href === '/') return path === '/' || path === '';
    return path.startsWith(href);
  }
</script>

<header class="border-b border-[var(--border)] bg-[var(--bg-secondary)]/80 backdrop-blur-sm sticky top-0 z-50">
  <div class="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
    <a href="#/" class="flex items-center gap-2.5 no-underline group">
      <div class="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.3)] group-hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-shadow">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </div>
      <span class="font-bold text-base tracking-tight text-[var(--text-primary)]">Aegis</span>
      <span class="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent-light)] border border-[var(--accent)]/20">ORACLE</span>
    </a>

    <nav class="flex items-center gap-1 text-sm">
      <a href="#/" class="px-3 py-1.5 rounded-lg transition-all no-underline {isActive('/') ? 'text-[var(--text-primary)] bg-[var(--accent)]/10' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'}">Scan</a>
      <a href="#/explore" class="px-3 py-1.5 rounded-lg transition-all no-underline {isActive('/explore') ? 'text-[var(--text-primary)] bg-[var(--accent)]/10' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'}">Explorer</a>
      <a href="#/stats" class="px-3 py-1.5 rounded-lg transition-all no-underline {isActive('/stats') ? 'text-[var(--text-primary)] bg-[var(--accent)]/10' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'}">Stats</a>
    </nav>
  </div>
</header>
