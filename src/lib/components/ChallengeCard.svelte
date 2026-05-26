<script lang="ts">
	import type { Concept } from '$lib/types';
	import { CATEGORY_LABELS } from '$lib/types';
	import { slide } from 'svelte/transition';

	let { concept, onReroll }: { concept: Concept; onReroll: () => void } = $props();

	let expanded = $state(false);

	function toggle() {
		expanded = !expanded;
	}

	function onHeaderKey(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			toggle();
		}
	}
</script>

<article
	class="overflow-hidden rounded-[var(--radius-card)] border border-border bg-card transition-colors"
>
	<div class="flex items-start gap-2">
		<div
			role="button"
			tabindex="0"
			aria-expanded={expanded}
			onclick={toggle}
			onkeydown={onHeaderKey}
			class="flex flex-1 cursor-pointer items-start gap-3 px-5 py-4 transition-colors hover:bg-card-2"
		>
			<div class="flex min-w-0 flex-1 flex-col gap-2">
				<p class="text-[10px] font-semibold tracking-[0.2em] text-accent uppercase">
					{CATEGORY_LABELS[concept.category]}
				</p>
				<h3 class="text-base leading-snug font-semibold">{concept.name}</h3>
				<p class="text-sm leading-relaxed text-fg/90">{concept.prompt}</p>
			</div>
			<span
				class="shrink-0 pt-1 text-xs text-muted transition-transform"
				class:rotate-180={expanded}
				aria-hidden="true">▾</span
			>
		</div>

		<button
			type="button"
			aria-label="Reroll this card"
			title="Reroll this card"
			onclick={onReroll}
			class="mt-3 mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-card-2 hover:text-fg"
		>
			<svg
				viewBox="0 0 24 24"
				width="18"
				height="18"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M21 12a9 9 0 1 1-3-6.7" />
				<path d="M21 4v5h-5" />
			</svg>
		</button>
	</div>

	{#if expanded}
		<div transition:slide={{ duration: 180 }} class="border-t border-border/60 px-5 py-4">
			<p class="text-sm leading-relaxed text-fg/80">{concept.definition}</p>
			{#if concept.wikiSummary}
				<p class="mt-3 text-xs leading-relaxed text-muted italic">{concept.wikiSummary}</p>
			{/if}
			{#if concept.wikiUrl}
				<a
					href={concept.wikiUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
				>
					Read more on Wikipedia
					<svg
						viewBox="0 0 24 24"
						width="12"
						height="12"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
					>
						<path d="M7 17L17 7" />
						<path d="M7 7h10v10" />
					</svg>
				</a>
			{/if}
		</div>
	{/if}
</article>
