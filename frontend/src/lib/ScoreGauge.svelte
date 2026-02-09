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
    <!-- Background circle -->
    <circle
      cx="50" cy="50" r="45"
      fill="none"
      stroke="#1e1e32"
      stroke-width="8"
    />
    <!-- Score arc -->
    <circle
      cx="50" cy="50" r="45"
      fill="none"
      stroke={color}
      stroke-width="8"
      stroke-linecap="round"
      stroke-dasharray={circumference}
      stroke-dashoffset={dashOffset}
      transform="rotate(-90 50 50)"
      class="gauge-arc"
    />
  </svg>
  <div class="gauge-center">
    <span class="gauge-score" style="color: {color}">{score}</span>
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
    transition: stroke-dashoffset 1s ease-out;
  }
  .gauge-center {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  .gauge-score {
    font-size: 2rem;
    font-weight: 800;
    line-height: 1;
  }
  .gauge-label {
    font-size: 0.65rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }
</style>
