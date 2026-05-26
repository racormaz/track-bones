<script lang="ts">
	let {
		size = 96,
		color = 'var(--color-spark)',
		animate = false,
		strokeWidth = 1.75
	}: { size?: number; color?: string; animate?: boolean; strokeWidth?: number } = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke={color}
	stroke-width={strokeWidth}
	stroke-linecap="round"
	aria-hidden="true"
	class:animate
>
	<circle cx="12" cy="12" r="2.4" fill={color} stroke="none" />
	<line x1="12" y1="12" x2="12" y2="1.5" />
	<line x1="12" y1="12" x2="21.5" y2="5" />
	<line x1="12" y1="12" x2="22" y2="16.5" />
	<line x1="12" y1="12" x2="6" y2="22" />
	<line x1="12" y1="12" x2="2" y2="9.5" />
</svg>

<style>
	@media (prefers-reduced-motion: no-preference) {
		.animate {
			animation: spark-strike 420ms cubic-bezier(0.2, 0.9, 0.3, 1) both;
			transform-origin: 50% 50%;
		}
		@keyframes spark-strike {
			from {
				opacity: 0;
				transform: scale(0.55) rotate(-12deg);
			}
			to {
				opacity: 1;
				transform: scale(1) rotate(0);
			}
		}
	}
</style>
