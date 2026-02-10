<script lang="ts">
  import { scoreBgColor, scoreLabel } from './api';

  export let score: number;
  export let size: number = 160;

  $: color = scoreBgColor(score);
  $: label = scoreLabel(score);
  $: circumference = 2 * Math.PI * 45;
  $: dashOffset = circumference - (score / 100) * circumference;
</script>

<div class="gauge" style="width: {size}px; height: {size}px;">
  <svg viewBox="0 0 100 100" class="gauge-svg">
    <defs>
      <filter id="glow-{score}">
        <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <!-- Background circle -->
    <circle
      cx="50" cy="50" r="45"
      fill="none"
      stroke="var(--c-surface)"
      stroke-width="5"
    />
    <!-- Track -->
    <circle
      cx="50" cy="50" r="45"
      fill="none"
      stroke="var(--c-border)"
      stroke-width="5"
    />
    <!-- Score arc -->
    <circle
      cx="50" cy="50" r="45"
      fill="none"
      stroke={color}
      stroke-width="5"
      stroke-linecap="round"
      stroke-dasharray={circumference}
      stroke-dashoffset={dashOffset}
      transform="rotate(-90 50 50)"
      class="gauge-arc"
      filter="url(#glow-{score})"
    />
  </svg>
  <div class="gauge-center">
    <span class="gauge-score" style="color: {color}; text-shadow: 0 0 24px {color}66, 0 0 48px {color}22">{score}</span>
    <span class="gauge-label">{label}</span>
  </div>
</div>

<style>
  .gauge {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .gauge-svg {
    width: 100%;
    height: 100%;
  }

  .gauge-arc {
    transition: stroke-dashoffset 1s var(--ease-out);
  }

  .gauge-center {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .gauge-score {
    font-family: var(--f-display);
    font-size: 2rem;
    font-weight: 800;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  .gauge-label {
    font-family: var(--f-mono);
    font-size: 0.6rem;
    color: var(--c-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 500;
  }
</style>
