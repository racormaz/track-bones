<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import type {
		Concept,
		GenreId,
		Difficulty,
		Challenge,
		Mode,
		Genre,
		SectionId,
		SectionTemplate,
		Combo
	} from '$lib/types';
	import { CATEGORIES } from '$lib/types';
	import conceptsRaw from '$lib/content/concepts.json';
	import genresRaw from '$lib/content/genres.json';
	import combosRaw from '$lib/content/combos.json';
	import {
		preferences,
		setMode,
		setGenre,
		setDifficulty,
		setCombosEnabled,
		combosResolved
	} from '$lib/stores/preferences.svelte';
	import { history, saveChallenge, recentConceptIds } from '$lib/stores/history.svelte';
	import {
		generateChallenge,
		generateChallengeWithCombo,
		rerollOne,
		pickTemplate,
		assignSections,
		findActiveCombo
	} from '$lib/challenge/generator';
	import ModePicker from '$lib/components/ModePicker.svelte';
	import GenrePicker from '$lib/components/GenrePicker.svelte';
	import DifficultyPicker from '$lib/components/DifficultyPicker.svelte';
	import ChallengeView from '$lib/components/ChallengeView.svelte';
	import HistoryDrawer from '$lib/components/HistoryDrawer.svelte';

	const concepts = conceptsRaw as Concept[];
	const conceptsById = new Map(concepts.map((c) => [c.id, c] as const));
	const genres = genresRaw as Genre[];
	const genresById = new Map(genres.map((g) => [g.id, g] as const));
	const combos = combosRaw as Combo[];
	const combosById = new Map(combos.map((c) => [c.id, c] as const));

	type Step = 'mode' | 'genre' | 'difficulty' | 'challenge';

	let step = $state<Step>('mode');
	let conceptIds = $state<string[]>([]);
	let template = $state<SectionTemplate | null>(null);
	let sectionAssignments = $state<Record<string, SectionId> | undefined>(undefined);
	let activeCombo = $state<Combo | null>(null);
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
			const wantCombos = preferences.lastMode === 'deep' && combosResolved();

			if (wantCombos) {
				const result = generateChallengeWithCombo({
					concepts,
					combos,
					genre: preferences.lastGenre,
					difficulty: preferences.lastDifficulty,
					excludeIds: recentConceptIds(10)
				});
				conceptIds = result.conceptIds;
				activeCombo = result.comboId ? (combosById.get(result.comboId) ?? null) : null;
				if (!activeCombo) {
					showToast('No combos available for this set yet.');
				}
			} else {
				conceptIds = generateChallenge({
					concepts,
					genre: preferences.lastGenre,
					difficulty: preferences.lastDifficulty,
					excludeIds: recentConceptIds(10)
				});
				activeCombo = null;
			}

			if (preferences.lastMode === 'deep') {
				const genre = genresById.get(preferences.lastGenre);
				template = pickTemplate(genre?.templates);
				if (template) {
					sectionAssignments = assignSections({
						conceptIds,
						conceptsById,
						template
					});
				} else {
					sectionAssignments = undefined;
				}
			} else {
				template = null;
				sectionAssignments = undefined;
			}

			step = 'challenge';
		} catch (err) {
			console.error(err);
			showToast('Content library is empty or too sparse.');
		}
	}

	onMount(() => {
		if (
			preferences.lastMode &&
			preferences.lastGenre &&
			preferences.lastDifficulty &&
			concepts.length > 0
		) {
			generate();
		} else if (preferences.lastMode) {
			step = 'genre';
		}
	});

	function onPickMode(m: Mode) {
		setMode(m);
		if (preferences.lastGenre && preferences.lastDifficulty) {
			generate();
		} else {
			step = 'genre';
		}
	}

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

			// Re-assign sections if in Deep mode so the new concept sits somewhere sensible.
			if (preferences.lastMode === 'deep' && template) {
				sectionAssignments = assignSections({ conceptIds, conceptsById, template });
			}

			// Re-evaluate active combo: if the new picks still satisfy a combo, keep / find one.
			if (preferences.lastMode === 'deep' && combosResolved() && preferences.lastGenre && preferences.lastDifficulty) {
				activeCombo = findActiveCombo({
					combos,
					picked: conceptIds,
					genre: preferences.lastGenre,
					difficulty: preferences.lastDifficulty
				});
			}
		} catch (err) {
			console.error(err);
			showToast('No alternatives left for this slot.');
		}
	}

	function onRerollAll() {
		generate();
	}

	function onSave() {
		if (
			preferences.lastMode === null ||
			preferences.lastGenre === null ||
			preferences.lastDifficulty === null
		) {
			return;
		}
		if (conceptIds.length === 0) return;
		saveChallenge({
			mode: preferences.lastMode,
			genre: preferences.lastGenre,
			difficulty: preferences.lastDifficulty,
			conceptIds,
			templateId: template?.id,
			sectionAssignments,
			comboId: activeCombo?.id
		});
		showToast('Saved to history');
	}

	function onShowHistory() {
		drawerOpen = true;
	}

	function onOpenFromHistory(c: Challenge) {
		if (c.mode) setMode(c.mode);
		setGenre(c.genre);
		setDifficulty(c.difficulty);
		conceptIds = c.conceptIds.filter((id) => conceptsById.has(id));
		activeCombo = c.comboId ? (combosById.get(c.comboId) ?? null) : null;
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

		// Restore template + sections from saved challenge if present, otherwise re-derive.
		if (c.mode === 'deep') {
			const genre = genresById.get(c.genre);
			const savedTemplate = c.templateId
				? (genre?.templates ?? []).find((t) => t.id === c.templateId)
				: undefined;
			template = savedTemplate ?? pickTemplate(genre?.templates);
			if (template) {
				sectionAssignments =
					c.sectionAssignments ?? assignSections({ conceptIds, conceptsById, template });
			} else {
				sectionAssignments = undefined;
			}
		} else {
			template = null;
			sectionAssignments = undefined;
		}

		step = 'challenge';
		drawerOpen = false;
	}

	function onChangePrefs() {
		step = 'mode';
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
	{:else if step === 'mode'}
		<div in:fade={{ duration: 150 }}>
			<ModePicker selected={preferences.lastMode} onSelect={onPickMode} />
		</div>
	{:else if step === 'genre'}
		<div in:fade={{ duration: 150 }}>
			<GenrePicker selected={preferences.lastGenre} onSelect={onPickGenre} />
		</div>
	{:else if step === 'difficulty'}
		<div in:fade={{ duration: 150 }}>
			<DifficultyPicker
				selected={preferences.lastDifficulty}
				mode={preferences.lastMode}
				combosEnabled={combosResolved()}
				onSelect={onPickDifficulty}
				onCombosToggle={(enabled) => setCombosEnabled(enabled)}
			/>
		</div>
	{:else if step === 'challenge' && preferences.lastMode && preferences.lastGenre && preferences.lastDifficulty}
		<div in:fade={{ duration: 150 }}>
			<ChallengeView
				{conceptIds}
				{conceptsById}
				mode={preferences.lastMode}
				genre={preferences.lastGenre}
				difficulty={preferences.lastDifficulty}
				{template}
				{sectionAssignments}
				combo={activeCombo}
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
