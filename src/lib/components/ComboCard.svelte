<script lang="ts">
	import type { Combo, Concept } from '$lib/types';
	import Icon from './Icon.svelte';

	let {
		combo,
		conceptsById
	}: { combo: Combo; conceptsById: Map<string, Concept> } = $props();

	const a = $derived(conceptsById.get(combo.conceptIds[0]));
	const b = $derived(conceptsById.get(combo.conceptIds[1]));
</script>

<article
	class="combo-card overflow-hidden rounded-[var(--radius-card)] border border-[var(--combo-accent)] bg-card px-5 py-4"
>
	<header class="mb-2 flex items-center gap-2">
		<Icon name="link2" size={14} />
		<span class="text-[10px] font-semibold tracking-[0.2em] uppercase" style="color: var(--combo-accent);">
			Synergy
		</span>
	</header>

	<p class="text-sm leading-relaxed text-fg/95">{combo.synergyPrompt}</p>

	{#if a && b}
		<footer class="mt-3 flex items-center gap-2 text-xs text-muted">
			<span class="font-medium text-fg/80">{a.name}</span>
			<Icon name="link2" size={12} />
			<span class="font-medium text-fg/80">{b.name}</span>
		</footer>
	{/if}
</article>

<style>
	.combo-card {
		--combo-accent: #ffaa5e;
	}
</style>
