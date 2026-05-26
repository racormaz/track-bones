<script lang="ts">
	let {
		steps,
		hits,
		accents = []
	}: { steps: number; hits: number[]; accents?: number[] } = $props();

	const W = 280;
	const H = 56;
	const PAD_X = 4;
	const cellW = $derived((W - PAD_X * 2) / steps);
</script>

<svg
	viewBox="0 0 {W} {H}"
	width="100%"
	xmlns="http://www.w3.org/2000/svg"
	role="img"
	aria-label="Rhythm pattern with {hits.length} hits across {steps} steps"
>
	{#each Array(steps) as _, i (i)}
		{@const x = PAD_X + i * cellW}
		{@const isHit = hits.includes(i)}
		{@const isAccent = accents.includes(i)}
		<rect
			x={x + 2}
			y={isHit ? 12 : 22}
			width={cellW - 4}
			height={isHit ? 32 : 12}
			rx="2"
			fill={isAccent ? 'var(--color-accent)' : isHit ? 'var(--color-fg)' : 'var(--color-border)'}
			opacity={isHit ? 1 : 0.5}
		/>
		{#if i % 4 === 0}
			<line
				x1={x}
				y1="50"
				x2={x}
				y2="54"
				stroke="var(--color-muted)"
				stroke-width="1"
				opacity="0.5"
			/>
		{/if}
	{/each}
</svg>
