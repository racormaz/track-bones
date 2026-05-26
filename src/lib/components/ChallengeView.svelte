<script lang="ts">
	import type { Concept, GenreId, Difficulty, Mode, SectionId, SectionTemplate } from '$lib/types';
	import { DIFFICULTY_LABELS, MODE_LABELS, CATEGORIES } from '$lib/types';
	import ChallengeCard from './ChallengeCard.svelte';
	import SectionHeader from './SectionHeader.svelte';
	import Icon from './Icon.svelte';
	import genres from '$lib/content/genres.json';
	import type { Genre } from '$lib/types';

	let {
		conceptIds,
		conceptsById,
		mode,
		genre,
		difficulty,
		template,
		sectionAssignments,
		onRerollOne,
		onRerollAll,
		onSave,
		onShowHistory,
		onChangePrefs
	}: {
		conceptIds: string[];
		conceptsById: Map<string, Concept>;
		mode: Mode;
		genre: GenreId;
		difficulty: Difficulty;
		template?: SectionTemplate | null;
		sectionAssignments?: Record<string, SectionId>;
		onRerollOne: (index: number) => void;
		onRerollAll: () => void;
		onSave: () => void;
		onShowHistory: () => void;
		onChangePrefs: () => void;
	} = $props();

	const genreList = genres as Genre[];
	const genreLabel = $derived(genreList.find((g) => g.id === genre)?.label ?? genre);

	const orderedConcepts = $derived(
		conceptIds
			.map((id, i) => ({ concept: conceptsById.get(id), index: i }))
			.filter((x): x is { concept: Concept; index: number } => x.concept !== undefined)
	);

	const useSections = $derived(
		mode === 'deep' && template != null && sectionAssignments != null
	);

	// Build section → list of {concept, index} in section order, only when useSections.
	const grouped = $derived.by(() => {
		if (!useSections || !template || !sectionAssignments) return null;
		return template.sections
			.map((section) => ({
				section,
				items: orderedConcepts.filter(
					({ concept }) => sectionAssignments[concept.id] === section.id
				)
			}))
			.filter((group) => group.items.length > 0);
	});
</script>

<section class="flex flex-col gap-5 px-5 pt-8 pb-32">
	<header class="flex items-center justify-between gap-3">
		<button
			type="button"
			class="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs hover:bg-card-2"
			onclick={onChangePrefs}
		>
			<span class="text-accent">{MODE_LABELS[mode]}</span>
			<span class="text-border" aria-hidden="true">·</span>
			<span class="text-muted">{genreLabel}</span>
			<span class="text-border" aria-hidden="true">·</span>
			<span class="text-muted">{DIFFICULTY_LABELS[difficulty]}</span>
		</button>
		{#if useSections && template}
			<p class="text-xs text-muted">{template.label}</p>
		{:else}
			<p class="text-xs tracking-[0.18em] text-muted uppercase">Your bones</p>
		{/if}
	</header>

	{#if useSections && grouped}
		<div class="flex flex-col gap-3">
			{#each grouped as group (group.section.id)}
				<SectionHeader label={group.section.label} barHint={group.section.barHint} />
				<ol class="flex flex-col gap-3">
					{#each group.items as { concept, index } (concept.id)}
						<li>
							<ChallengeCard {concept} onReroll={() => onRerollOne(index)} />
						</li>
					{/each}
				</ol>
			{/each}
		</div>
	{:else}
		<ol class="flex flex-col gap-3">
			{#each CATEGORIES as cat, i (cat)}
				{@const item = orderedConcepts.find((x) => x.index === i)}
				{#if item}
					<li>
						<ChallengeCard concept={item.concept} onReroll={() => onRerollOne(i)} />
					</li>
				{/if}
			{/each}
		</ol>
	{/if}
</section>

<nav
	class="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg/95 backdrop-blur-md"
	style="padding-bottom: env(safe-area-inset-bottom);"
>
	<div class="mx-auto flex max-w-2xl items-stretch justify-around gap-1 px-3 py-3">
		<button
			type="button"
			class="flex flex-1 flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-xs hover:bg-card"
			onclick={onRerollAll}
		>
			<Icon name="rotate-cw" size={20} />
			Reroll all
		</button>

		<button
			type="button"
			class="flex flex-1 flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-xs hover:bg-card"
			onclick={onSave}
		>
			<Icon name="star" size={20} />
			Save
		</button>

		<button
			type="button"
			class="flex flex-1 flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-xs hover:bg-card"
			onclick={onShowHistory}
		>
			<Icon name="history" size={20} />
			History
		</button>
	</div>
</nav>
