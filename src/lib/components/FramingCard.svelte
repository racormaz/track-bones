<script lang="ts">
	import type { Concept, RefKind } from '$lib/types';
	import { slide } from 'svelte/transition';
	import Icon, { type IconName } from './Icon.svelte';

	let {
		concept,
		onReroll
	}: { concept: Concept; onReroll: () => void } = $props();

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
	class="framing-card overflow-hidden rounded-[var(--radius-card)] border border-accent/40 bg-card"
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
					Overall · Arrangement
				</p>
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
			aria-label="Reroll the overall framing"
			title="Reroll framing"
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
	.framing-card {
		background: linear-gradient(180deg, color-mix(in srgb, var(--color-accent) 10%, var(--color-card)), var(--color-card) 70%);
	}
</style>
