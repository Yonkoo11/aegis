<script lang="ts">
  import { currentPath, matchRoute } from './lib/router';
  import Header from './lib/Header.svelte';
  import Home from './pages/Home.svelte';
  import Report from './pages/Report.svelte';
  import Explore from './pages/Explore.svelte';
  import Stats from './pages/Stats.svelte';

  let path = '/';
  let reportAddress = '';

  currentPath.subscribe(p => {
    path = p;
    const reportMatch = matchRoute('/report/:address', p);
    if (reportMatch) {
      reportAddress = reportMatch.address;
    }
  });
</script>

<Header />
<main>
  {#if path === '/' || path === ''}
    <Home />
  {:else if matchRoute('/report/:address', path)}
    <Report address={reportAddress} />
  {:else if path === '/explore'}
    <Explore />
  {:else if path === '/stats'}
    <Stats />
  {:else}
    <div class="max-w-6xl mx-auto px-4 py-20 text-center" style="padding-top: 120px;">
      <h1 class="text-2xl font-bold mb-2 font-display" style="color: var(--c-text-bright);">404</h1>
      <p style="color: var(--c-muted);">Page not found</p>
      <a href="#/" class="text-sm mt-2 inline-block font-mono" style="color: var(--c-primary);">Back to home</a>
    </div>
  {/if}
</main>
