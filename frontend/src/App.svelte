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
    <div class="max-w-6xl mx-auto px-4 py-20 text-center">
      <h1 class="text-2xl font-bold mb-2">404</h1>
      <p class="text-[var(--text-secondary)]">Page not found</p>
      <a href="#/" class="text-[var(--accent-light)] text-sm mt-2 inline-block">Back to home</a>
    </div>
  {/if}
</main>
