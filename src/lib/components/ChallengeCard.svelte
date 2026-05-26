<script lang="ts">
	import type { Concept, RefKind } from '$lib/types';
	import { CATEGORY_LABELS } from '$lib/types';
	import { slide } from 'svelte/transition';
	import Icon, { type IconName } from './Icon.svelte';

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

	const REF_KIND_ICON: Record<RefKind, IconName> = {
		article: 'book-open',
		video: 'play',
		interactive: 'mouse-pointer-click'
	};
</script>

<article
	class="card overflow-hidden rounded-[var(--radius-card)] border border-border bg-card transition-colors"
	class:rarity-rare={concept.rarity === 'rare'}
	class:rarity-legendary={concept.rarity === 'legendary'}
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
				<div class="flex items-center gap-2">
					<p class="text-[10px] font-semibold tracking-[0.2em] text-accent uppercase">
						{CATEGORY_LABELS[concept.category]}
					</p>
					{#if concept.rarity === 'rare'}
						<span class="rarity-tag inline-flex items-center gap-1 text-[9px] font-semibold tracking-[0.18em] uppercase">
							<Icon name="sparkle" size={10} />Rare
						</span>
					{:else if concept.rarity === 'legendary'}
						<span class="rarity-tag inline-flex items-center gap-1 text-[9px] font-semibold tracking-[0.18em] uppercase">
							<Icon name="sparkles" size={10} />Legendary
						</span>
					{/if}
				</div>
				<h3 class="text-base leading-snug font-semibold">{concept.name}</h3>
				<p class="text-sm leading-relaxed text-fg/90">{concept.prompt}</p>
			</div>
			<span
				class="shrink-0 pt-1 text-muted transition-transform"
				class:rotate-180={expanded}
				aria-hidden="true"
			>
				<Icon name="chevron-down" size={16} />
			</span>
		</div>

		<button
			type="button"
			aria-label="Reroll this card"
			title="Reroll this card"
			onclick={onReroll}
			class="mt-3 mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-card-2 hover:text-fg"
		>
			<Icon name="rotate-cw" />
		</button>
	</div>

	{#if expanded}
		<div transition:slide={{ duration: 180 }} class="border-t border-border/60 px-5 py-4">
			<p class="text-sm leading-relaxed text-fg/80">{concept.definition}</p>
			{#if concept.wikiSummary}
				<p class="mt-3 text-xs leading-relaxed text-muted italic">{concept.wikiSummary}</p>
			{/if}
			{#if concept.wikiUrl || concept.secondaryRef}
				<div class="mt-4 flex flex-col gap-2">
					{#if concept.wikiUrl}
						<a
							href={concept.wikiUrl}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
						>
							<Icon name="book-open" size={12} />
							<span>Wikipedia</span>
							<Icon name="external-link" size={12} />
						</a>
					{/if}
					{#if concept.secondaryRef}
						<a
							href={concept.secondaryRef.url}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
						>
							<Icon name={REF_KIND_ICON[concept.secondaryRef.kind]} size={12} />
							<span>{concept.secondaryRef.label}</span>
							<Icon name="external-link" size={12} />
						</a>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</article>

<style>
	.card.rarity-rare {
		border-color: rgba(124, 92, 255, 0.55);
		box-shadow: 0 0 0 1px rgba(124, 92, 255, 0.25);
	}
	.card.rarity-rare .rarity-tag {
		color: #b8a4ff;
	}
	.card.rarity-legendary {
		border-color: #ffd166;
		box-shadow: 0 0 24px -4px rgba(255, 209, 102, 0.35);
		background: linear-gradient(180deg, rgba(255, 209, 102, 0.04), transparent 60%), var(--color-card);
	}
	.card.rarity-legendary .rarity-tag {
		color: #ffd166;
	}
	@media (prefers-reduced-motion: no-preference) {
		.card.rarity-legendary {
			animation: legendary-pulse 4.5s ease-in-out infinite;
		}
	}
	@keyframes legendary-pulse {
		0%,
		100% {
			box-shadow: 0 0 24px -4px rgba(255, 209, 102, 0.35);
		}
		50% {
			box-shadow: 0 0 32px -2px rgba(255, 209, 102, 0.55);
		}
	}
</style>
