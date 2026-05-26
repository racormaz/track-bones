<script lang="ts">
	type Shape = 'sine' | 'saw' | 'square' | 'triangle' | 'noise';
	let { shape }: { shape: Shape } = $props();

	const W = 280;
	const H = 80;
	const CYCLES = 3;

	function generatePath(s: Shape): string {
		const samples = 240;
		const cycleW = W / CYCLES;
		const amp = H / 2 - 8;
		const cy = H / 2;
		let d = '';

		for (let i = 0; i <= samples; i++) {
			const x = (i / samples) * W;
			const t = ((i / samples) * CYCLES) % 1; // 0..1 within cycle
			let y = cy;
			switch (s) {
				case 'sine':
					y = cy - Math.sin(t * Math.PI * 2) * amp;
					break;
				case 'saw':
					y = cy - (t * 2 - 1) * amp;
					break;
				case 'square':
					y = cy - (t < 0.5 ? 1 : -1) * amp;
					break;
				case 'triangle': {
					const v = t < 0.5 ? t * 4 - 1 : 3 - t * 4;
					y = cy - v * amp;
					break;
				}
				case 'noise': {
					// deterministic pseudo-random based on x — keeps SVG stable across renders
					const r = Math.sin(i * 12.9898) * 43758.5453;
					y = cy - (r - Math.floor(r)) * amp * 2 + amp;
					break;
				}
			}
			d += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ' ' + y.toFixed(2) + ' ';
		}
		return d.trim();
	}

	const path = $derived(generatePath(shape));
</script>

<svg
	viewBox="0 0 {W} {H}"
	width="100%"
	xmlns="http://www.w3.org/2000/svg"
	role="img"
	aria-label="{shape} waveform"
>
	<line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="var(--color-border)" stroke-width="1" opacity="0.5" />
	<path d={path} fill="none" stroke="var(--color-accent)" stroke-width="2" stroke-linejoin="round" />
</svg>
