<script lang="ts">
	let { points }: { points: number[] } = $props();

	const W = 280;
	const H = 100;
	const PAD = 8;

	const path = $derived.by(() => {
		if (points.length === 0) return '';
		const innerW = W - PAD * 2;
		const innerH = H - PAD * 2;
		const stepX = innerW / Math.max(1, points.length - 1);
		const pts = points.map((p, i) => {
			const x = PAD + i * stepX;
			const y = PAD + innerH - p * innerH;
			return { x, y };
		});
		// smooth cardinal-ish curve via cubic
		let d = `M${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
		for (let i = 1; i < pts.length; i++) {
			const p0 = pts[i - 1];
			const p1 = pts[i];
			const cx = (p0.x + p1.x) / 2;
			d += ` C${cx.toFixed(2)} ${p0.y.toFixed(2)}, ${cx.toFixed(2)} ${p1.y.toFixed(2)}, ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
		}
		return d;
	});

	const fillPath = $derived(path ? path + ` L${W - PAD} ${H - PAD} L${PAD} ${H - PAD} Z` : '');
</script>

<svg
	viewBox="0 0 {W} {H}"
	width="100%"
	xmlns="http://www.w3.org/2000/svg"
	role="img"
	aria-label="Energy curve across the track"
>
	<defs>
		<linearGradient id="energy-fill" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stop-color="var(--color-accent)" stop-opacity="0.35" />
			<stop offset="100%" stop-color="var(--color-accent)" stop-opacity="0" />
		</linearGradient>
	</defs>
	<!-- baseline -->
	<line
		x1={0}
		y1={H - 8}
		x2={W}
		y2={H - 8}
		stroke="var(--color-border)"
		stroke-width="1"
		opacity="0.4"
	/>
	{#if fillPath}
		<path d={fillPath} fill="url(#energy-fill)" />
	{/if}
	{#if path}
		<path d={path} fill="none" stroke="var(--color-accent)" stroke-width="2" stroke-linejoin="round" />
	{/if}
</svg>
