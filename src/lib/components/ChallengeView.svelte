<script lang="ts">
	import type { Concept, GenreId, Difficulty, Mode } from '$lib/types';
	import { DIFFICULTY_LABELS, MODE_LABELS, CATEGORIES } from '$lib/types';
	import ChallengeCard from './ChallengeCard.svelte';
	import Icon from './Icon.svelte';
	import genres from '$lib/content/genres.json';
	import type { Genre } from '$lib/types';

	let {
		conceptIds,
		conceptsById,
		mode,
		genre,
		difficulty,
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
		onRerollOne: (index: number) => void;
		onRerollAll: () => void;
		onSave: () => void;
		onShowHistory: () => void;
		onChangePrefs: () => void;
	} = $props();

	const genreList = genres as Genre[];
	const genreLabel = $derived(genreList.find((g) => g.id === genre)?.label ?? genre);

	const orderedConcepts = $derived(
		conceptIds.map((id) => conceptsById.get(id)).filter((c): c is Concept => c !== undefined)
	);
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
		<p class="text-xs tracking-[0.18em] text-muted uppercase">Your bones</p>
	</header>

	<ol class="flex flex-col gap-3">
		{#each CATEGORIES as cat, i (cat)}
			{#if orderedConcepts[i]}
				<li>
					<ChallengeCard concept={orderedConcepts[i]} onReroll={() => onRerollOne(i)} />
				</li>
			{/if}
		{/each}
	</ol>
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
