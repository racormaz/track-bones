<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import type { Concept, GenreId, Difficulty, Challenge } from '$lib/types';
	import { CATEGORIES } from '$lib/types';
	import conceptsRaw from '$lib/content/concepts.json';
	import { preferences, setGenre, setDifficulty } from '$lib/stores/preferences.svelte';
	import { history, saveChallenge, recentConceptIds } from '$lib/stores/history.svelte';
	import { generateChallenge, rerollOne } from '$lib/challenge/generator';
	import GenrePicker from '$lib/components/GenrePicker.svelte';
	import DifficultyPicker from '$lib/components/DifficultyPicker.svelte';
	import ChallengeView from '$lib/components/ChallengeView.svelte';
	import HistoryDrawer from '$lib/components/HistoryDrawer.svelte';

	const concepts = conceptsRaw as Concept[];
	const conceptsById = new Map(concepts.map((c) => [c.id, c] as const));

	type Step = 'genre' | 'difficulty' | 'challenge';

	let step = $state<Step>('genre');
	let conceptIds = $state<string[]>([]);
	let drawerOpen = $state(false);
	let toast = $state<string | null>(null);

	function showToast(msg: string) {
		toast = msg;
		setTimeout(() => {
			if (toast === msg) toast = null;
		}, 1600);
	}

	function generate() {
		if (preferences.lastGenre === null || preferences.lastDifficulty === null) return;
		try {
			conceptIds = generateChallenge({
				concepts,
				genre: preferences.lastGenre,
				difficulty: preferences.lastDifficulty,
				excludeIds: recentConceptIds(10)
			});
			step = 'challenge';
		} catch (err) {
			console.error(err);
			showToast('Content library is empty or too sparse.');
		}
	}

	onMount(() => {
		if (preferences.lastGenre && preferences.lastDifficulty && concepts.length > 0) {
			generate();
		}
	});

	function onPickGenre(g: GenreId) {
		setGenre(g);
		step = 'difficulty';
	}

	function onPickDifficulty(d: Difficulty) {
		setDifficulty(d);
		generate();
	}

	function onRerollOne(index: number) {
		if (preferences.lastGenre === null || preferences.lastDifficulty === null) return;
		const category = CATEGORIES[index];
		const currentId = conceptIds[index];
		try {
			const newId = rerollOne({
				concepts,
				genre: preferences.lastGenre,
				difficulty: preferences.lastDifficulty,
				category,
				currentId,
				excludeIds: [...conceptIds, ...recentConceptIds(10)]
			});
			conceptIds = conceptIds.map((id, i) => (i === index ? newId : id));
		} catch (err) {
			console.error(err);
			showToast('No alternatives left for this slot.');
		}
	}

	function onRerollAll() {
		generate();
	}

	function onSave() {
		if (preferences.lastGenre === null || preferences.lastDifficulty === null) return;
		if (conceptIds.length === 0) return;
		saveChallenge({
			genre: preferences.lastGenre,
			difficulty: preferences.lastDifficulty,
			conceptIds
		});
		showToast('Saved to history');
	}

	function onShowHistory() {
		drawerOpen = true;
	}

	function onOpenFromHistory(c: Challenge) {
		setGenre(c.genre);
		setDifficulty(c.difficulty);
		conceptIds = c.conceptIds.filter((id) => conceptsById.has(id));
		// If any concept was deleted since save, refill missing slots.
		if (conceptIds.length < CATEGORIES.length) {
			try {
				conceptIds = generateChallenge({
					concepts,
					genre: c.genre,
					difficulty: c.difficulty,
					excludeIds: conceptIds
				});
			} catch {
				/* leave partial */
			}
		}
		step = 'challenge';
		drawerOpen = false;
	}

	function onChangePrefs() {
		step = 'genre';
	}
</script>

<svelte:head>
	<title>Track Bones</title>
</svelte:head>

<div class="mx-auto max-w-2xl">
	<header class="px-5 pt-6 pb-1">
		<a href="./" class="inline-flex items-center gap-2">
			<span class="inline-block h-2 w-2 rounded-full bg-accent" aria-hidden="true"></span>
			<span class="text-sm font-semibold tracking-tight text-fg">Track Bones</span>
		</a>
	</header>

	{#if concepts.length === 0}
		<div class="px-5 pt-16 text-center">
			<h2 class="text-lg font-semibold">Content library is empty.</h2>
			<p class="mt-2 text-sm text-muted">
				The concepts.json seed hasn't been authored yet. Generation will be available once it is.
			</p>
		</div>
	{:else if step === 'genre'}
		<div in:fade={{ duration: 150 }}>
			<GenrePicker selected={preferences.lastGenre} onSelect={onPickGenre} />
		</div>
	{:else if step === 'difficulty'}
		<div in:fade={{ duration: 150 }}>
			<DifficultyPicker selected={preferences.lastDifficulty} onSelect={onPickDifficulty} />
		</div>
	{:else if step === 'challenge' && preferences.lastGenre && preferences.lastDifficulty}
		<div in:fade={{ duration: 150 }}>
			<ChallengeView
				{conceptIds}
				{conceptsById}
				genre={preferences.lastGenre}
				difficulty={preferences.lastDifficulty}
				{onRerollOne}
				{onRerollAll}
				{onSave}
				{onShowHistory}
				{onChangePrefs}
			/>
		</div>
	{/if}
</div>

{#if drawerOpen}
	<HistoryDrawer onClose={() => (drawerOpen = false)} onOpen={onOpenFromHistory} />
{/if}

{#if toast}
	<div
		class="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-accent px-4 py-2 text-xs font-medium text-accent-fg shadow-lg"
		transition:fade={{ duration: 120 }}
	>
		{toast}
	</div>
{/if}
