<script lang="ts">
	import type { Concept, GenreId, Difficulty } from '$lib/types';
	import { DIFFICULTY_LABELS, CATEGORIES } from '$lib/types';
	import ChallengeCard from './ChallengeCard.svelte';
	import genres from '$lib/content/genres.json';
	import type { Genre } from '$lib/types';

	let {
		conceptIds,
		conceptsById,
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
			<span class="text-muted">{genreLabel}</span>
			<span class="text-border" aria-hidden="true">·</span>
			<span class="text-muted">{DIFFICULTY_LABELS[difficulty]}</span>
			<span class="text-fg" aria-hidden="true">↺</span>
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
			<svg
				viewBox="0 0 24 24"
				width="20"
				height="20"
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
			Reroll all
		</button>

		<button
			type="button"
			class="flex flex-1 flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-xs hover:bg-card"
			onclick={onSave}
		>
			<svg
				viewBox="0 0 24 24"
				width="20"
				height="20"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z" />
			</svg>
			Save
		</button>

		<button
			type="button"
			class="flex flex-1 flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-xs hover:bg-card"
			onclick={onShowHistory}
		>
			<svg
				viewBox="0 0 24 24"
				width="20"
				height="20"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<line x1="3" y1="6" x2="21" y2="6" />
				<line x1="3" y1="12" x2="21" y2="12" />
				<line x1="3" y1="18" x2="21" y2="18" />
			</svg>
			History
		</button>
	</div>
</nav>
