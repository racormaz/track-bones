<script lang="ts">
	import type { Visual } from '$lib/types';
	import RhythmGrid from './visuals/RhythmGrid.svelte';
	import Waveform from './visuals/Waveform.svelte';
	import EnergyCurve from './visuals/EnergyCurve.svelte';

	let { visual }: { visual: Visual | undefined } = $props();
</script>

{#if visual && visual.type !== 'none'}
	<div class="rounded-lg border border-border/60 bg-card-2/40 p-3">
		{#if visual.type === 'rhythm-grid'}
			<RhythmGrid steps={visual.steps} hits={visual.hits} accents={visual.accents} />
		{:else if visual.type === 'waveform'}
			<Waveform shape={visual.shape} />
		{:else if visual.type === 'energy-curve'}
			<EnergyCurve points={visual.points} />
		{/if}
	</div>
{/if}
