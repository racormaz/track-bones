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
		generateDeepChallenge,
		rerollSectionPick,
		rerollFraming,
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
	// Quick-mode: 5 cards, one per category in CATEGORIES order.
	// Deep-mode: deepSectionPicks is the source of truth; conceptIds is a derived flat list.
	let conceptIds = $state<string[]>([]);
	let template = $state<SectionTemplate | null>(null);
	let deepSectionPicks = $state<{ sectionId: SectionId; conceptId: string }[]>([]);
	let framingConceptId = $state<string | null>(null);
	let activeCombo = $state<Combo | null>(null);
	let drawerOpen = $state(false);
	let toast = $state<string | null>(null);

	const framingConcept = $derived(framingConceptId ? (conceptsById.get(framingConceptId) ?? null) : null);

	function showToast(msg: string) {
		toast = msg;
		setTimeout(() => {
			if (toast === msg) toast = null;
		}, 1600);
	}

	// Flat list of all currently-picked concept IDs (used for combo detection, history saves).
	function flatPicks(): string[] {
		if (preferences.lastMode === 'deep') {
			return [
				...(framingConceptId ? [framingConceptId] : []),
				...deepSectionPicks.map((p) => p.conceptId)
			];
		}
		return conceptIds;
	}

	function refreshCombo() {
		if (
			preferences.lastMode !== 'deep' ||
			!combosResolved() ||
			!preferences.lastGenre ||
			!preferences.lastDifficulty
		) {
			activeCombo = null;
			return;
		}
		activeCombo = findActiveCombo({
			combos,
			picked: flatPicks(),
			genre: preferences.lastGenre,
			difficulty: preferences.lastDifficulty
		});
	}

	function generateQuick() {
		if (preferences.lastGenre === null || preferences.lastDifficulty === null) return;
		conceptIds = generateChallenge({
			concepts,
			genre: preferences.lastGenre,
			difficulty: preferences.lastDifficulty,
			excludeIds: recentConceptIds(10)
		});
		template = null;
		deepSectionPicks = [];
		framingConceptId = null;
		activeCombo = null;
	}

	function generateDeep() {
		if (preferences.lastGenre === null || preferences.lastDifficulty === null) return;
		const genre = genresById.get(preferences.lastGenre);
		const picked = pickTemplate(genre?.templates);
		if (!picked) {
			// No templates authored for this genre — fall back to Quick layout.
			template = null;
			deepSectionPicks = [];
			framingConceptId = null;
			generateQuick();
			showToast('No templates for this genre yet. Showing flat brief.');
			return;
		}
		template = picked;

		const result = generateDeepChallenge({
			concepts,
			template: picked,
			genre: preferences.lastGenre,
			difficulty: preferences.lastDifficulty,
			excludeIds: recentConceptIds(10)
		});
		framingConceptId = result.framingConceptId;
		deepSectionPicks = result.sectionPicks;
		conceptIds = flatPicks(); // sync for history/save
		refreshCombo();

		if (combosResolved() && !activeCombo) {
			// Try to bias toward a combo by regenerating with the combo-aware path
			// IF the user explicitly opted in. We pull the picks from the regular
			// algorithm first and only retry if no combo surfaced naturally —
			// the curated combos are small enough that they often won't trigger
			// with random distribution. This is best-effort.
			const comboResult = generateChallengeWithCombo({
				concepts,
				combos,
				genre: preferences.lastGenre,
				difficulty: preferences.lastDifficulty,
				excludeIds: recentConceptIds(10)
			});
			if (comboResult.comboId) {
				// We have a combo. Re-derive deep section picks around those concept IDs.
				const lockedIds = new Set(comboResult.conceptIds);
				const deepResult = generateDeepChallenge({
					concepts,
					template: picked,
					genre: preferences.lastGenre,
					difficulty: preferences.lastDifficulty,
					excludeIds: [...recentConceptIds(10)]
				});
				// If the locked combo ids landed in deep, use it; otherwise stick with the original.
				const deepIds = new Set([
					...(deepResult.framingConceptId ? [deepResult.framingConceptId] : []),
					...deepResult.sectionPicks.map((p) => p.conceptId)
				]);
				const containsCombo = [...lockedIds].every((id) => deepIds.has(id));
				if (containsCombo) {
					framingConceptId = deepResult.framingConceptId;
					deepSectionPicks = deepResult.sectionPicks;
					conceptIds = [...deepIds];
					activeCombo = combosById.get(comboResult.comboId) ?? null;
				}
			}
		}
	}

	function generate() {
		try {
			if (preferences.lastMode === 'deep') {
				generateDeep();
			} else {
				generateQuick();
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
		// Always walk through genre + difficulty after a mode pick so the user can
		// change any of the three when they hit the picker flow. The fast-path back
		// to the challenge view only fires on initial app load (onMount) when all
		// three prefs are already cached.
		step = 'genre';
	}

	function onPickGenre(g: GenreId) {
		setGenre(g);
		step = 'difficulty';
	}

	function onPickDifficulty(d: Difficulty) {
		setDifficulty(d);
		generate();
	}

	// Quick-mode reroll: by category index.
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

	// Deep-mode reroll: by section id.
	function onRerollSection(sectionId: SectionId) {
		if (
			!template ||
			preferences.lastGenre === null ||
			preferences.lastDifficulty === null
		) {
			return;
		}
		const current = deepSectionPicks.find((p) => p.sectionId === sectionId);
		if (!current) return;
		const otherIds = deepSectionPicks
			.filter((p) => p.sectionId !== sectionId)
			.map((p) => p.conceptId);
		try {
			const newId = rerollSectionPick({
				concepts,
				template,
				sectionId,
				currentId: current.conceptId,
				otherPickedIds: otherIds,
				framingId: framingConceptId,
				genre: preferences.lastGenre,
				difficulty: preferences.lastDifficulty,
				excludeIds: recentConceptIds(10)
			});
			deepSectionPicks = deepSectionPicks.map((p) =>
				p.sectionId === sectionId ? { ...p, conceptId: newId } : p
			);
			conceptIds = flatPicks();
			refreshCombo();
		} catch (err) {
			console.error(err);
			showToast('No alternatives left for this section.');
		}
	}

	function onRerollFraming() {
		if (
			!template ||
			preferences.lastGenre === null ||
			preferences.lastDifficulty === null
		) {
			return;
		}
		try {
			const newId = rerollFraming({
				concepts,
				template,
				currentId: framingConceptId,
				pickedIds: deepSectionPicks.map((p) => p.conceptId),
				genre: preferences.lastGenre,
				difficulty: preferences.lastDifficulty,
				excludeIds: recentConceptIds(10)
			});
			framingConceptId = newId;
			conceptIds = flatPicks();
			refreshCombo();
		} catch (err) {
			console.error(err);
			showToast('No alternative framing available.');
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
			deepSectionPicks: preferences.lastMode === 'deep' ? deepSectionPicks : undefined,
			framingConceptId: framingConceptId ?? undefined,
			comboId: activeCombo?.id
		});
		showToast('Saved to history');
	}

	function onShowHistory() {
		drawerOpen = true;
	}

	function onOpenFromHistory(c: Challenge) {
		setMode(c.mode);
		setGenre(c.genre);
		setDifficulty(c.difficulty);
		conceptIds = c.conceptIds.filter((id) => conceptsById.has(id));
		activeCombo = c.comboId ? (combosById.get(c.comboId) ?? null) : null;

		if (c.mode === 'deep') {
			const genre = genresById.get(c.genre);
			template = c.templateId
				? ((genre?.templates ?? []).find((t) => t.id === c.templateId) ?? pickTemplate(genre?.templates))
				: pickTemplate(genre?.templates);
			deepSectionPicks = c.deepSectionPicks ?? [];
			framingConceptId = c.framingConceptId ?? null;

			// If somehow we lost section picks (corrupt save?), regenerate.
			if (template && deepSectionPicks.length === 0) {
				const result = generateDeepChallenge({
					concepts,
					template,
					genre: c.genre,
					difficulty: c.difficulty,
					excludeIds: recentConceptIds(10)
				});
				framingConceptId = result.framingConceptId;
				deepSectionPicks = result.sectionPicks;
				conceptIds = flatPicks();
			}
		} else {
			template = null;
			deepSectionPicks = [];
			framingConceptId = null;
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
				{deepSectionPicks}
				{framingConcept}
				combo={activeCombo}
				{onRerollSection}
				{onRerollFraming}
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
