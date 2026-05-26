<script lang="ts">
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import type { Concept, Genre, Combo, GenreId, Difficulty, Mode } from '$lib/types';
	import { DIFFICULTY_LABELS, MODE_LABELS } from '$lib/types';
	import conceptsRaw from '$lib/content/concepts.json';
	import genresRaw from '$lib/content/genres.json';
	import combosRaw from '$lib/content/combos.json';
	import { preferences, combosResolved } from '$lib/stores/preferences.svelte';
	import { history, recentConceptIds } from '$lib/stores/history.svelte';
	import {
		generateChallenge,
		pickTemplate,
		generateDeepChallenge,
		findActiveCombo
	} from '$lib/challenge/generator';
	import { encodeChallenge } from '$lib/challenge/encode';
	import { openDrawer, showToast } from '$lib/stores/ui.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import SparkMark from '$lib/components/SparkMark.svelte';

	const concepts = conceptsRaw as Concept[];
	const genres = genresRaw as Genre[];
	const combos = combosRaw as Combo[];
	const genresById = new Map(genres.map((g) => [g.id, g] as const));

	const hasPrefs = $derived(
		preferences.lastMode !== null &&
			preferences.lastGenre !== null &&
			preferences.lastDifficulty !== null
	);

	const genreLabel = $derived(
		preferences.lastGenre
			? (genres.find((g) => g.id === preferences.lastGenre)?.label ?? preferences.lastGenre)
			: ''
	);

	function generateAndGo() {
		if (!preferences.lastMode || !preferences.lastGenre || !preferences.lastDifficulty) {
			goto(`${base}/mode`);
			return;
		}
		try {
			let encoded: string;
			if (preferences.lastMode === 'quick') {
				const ids = generateChallenge({
					concepts,
					genre: preferences.lastGenre,
					difficulty: preferences.lastDifficulty,
					excludeIds: recentConceptIds(10)
				});
				encoded = encodeChallenge({
					mode: 'quick',
					genre: preferences.lastGenre,
					difficulty: preferences.lastDifficulty,
					conceptIds: ids
				});
			} else {
				const genre = genresById.get(preferences.lastGenre);
				const template = pickTemplate(genre?.templates);
				if (!template) {
					const ids = generateChallenge({
						concepts,
						genre: preferences.lastGenre,
						difficulty: preferences.lastDifficulty,
						excludeIds: recentConceptIds(10)
					});
					encoded = encodeChallenge({
						mode: 'quick',
						genre: preferences.lastGenre,
						difficulty: preferences.lastDifficulty,
						conceptIds: ids
					});
				} else {
					const deep = generateDeepChallenge({
						concepts,
						template,
						genre: preferences.lastGenre,
						difficulty: preferences.lastDifficulty,
						excludeIds: recentConceptIds(10)
					});
					const flatIds = [
						...(deep.framingConceptId ? [deep.framingConceptId] : []),
						...deep.sectionPicks.map((p) => p.conceptId)
					];
					const refreshedComboId = combosResolved()
						? findActiveCombo({
								combos,
								picked: flatIds,
								genre: preferences.lastGenre,
								difficulty: preferences.lastDifficulty
							})?.id
						: undefined;
					encoded = encodeChallenge({
						mode: 'deep',
						genre: preferences.lastGenre,
						difficulty: preferences.lastDifficulty,
						conceptIds: flatIds,
						templateId: template.id,
						framingConceptId: deep.framingConceptId,
						deepSectionPicks: deep.sectionPicks,
						comboId: refreshedComboId
					});
				}
			}
			goto(`${base}/c/${encoded}`);
		} catch (err) {
			console.error(err);
			showToast('Content library is empty or too sparse.');
		}
	}

	function startFresh() {
		goto(`${base}/mode`);
	}
</script>

<section class="flex min-h-[calc(100svh-5rem)] flex-col justify-between px-5 pt-12 pb-12">
	<div class="flex flex-col items-center gap-8 pt-8">
		<div class="flex flex-col items-center gap-5">
			<SparkMark size={96} animate />
			<div class="flex flex-col items-center gap-1">
				<p class="text-2xl font-semibold tracking-[0.04em] text-fg">FyeStarta</p>
				<p class="text-[10px] tracking-[0.28em] text-muted uppercase">track ideation</p>
			</div>
		</div>

		<header class="flex flex-col items-center gap-2 text-center">
			<h1 class="text-4xl font-semibold tracking-tight">Break the wall.</h1>
			<p class="max-w-xs text-sm leading-relaxed text-muted">
				Constraint cards for electronic producers.
			</p>
		</header>
	</div>

	<div class="flex flex-col gap-3 pt-8">
		{#if hasPrefs && preferences.lastMode && preferences.lastDifficulty}
			<button
				type="button"
				onclick={generateAndGo}
				class="spark-cta flex w-full items-center justify-center gap-2 rounded-[var(--radius-card)] bg-accent px-5 py-4 text-base font-semibold text-accent-fg transition-colors"
			>
				Continue
				<span class="text-accent-fg/80 text-xs font-medium">
					({MODE_LABELS[preferences.lastMode]} · {genreLabel} · {DIFFICULTY_LABELS[preferences.lastDifficulty]})
				</span>
			</button>
			<button
				type="button"
				onclick={startFresh}
				class="w-full rounded-[var(--radius-card)] border border-border bg-card px-5 py-3 text-sm font-medium transition-colors hover:bg-card-2"
			>
				Start over
			</button>
		{:else}
			<button
				type="button"
				onclick={startFresh}
				class="spark-cta flex w-full items-center justify-center gap-2 rounded-[var(--radius-card)] bg-accent px-5 py-4 text-base font-semibold text-accent-fg transition-colors"
			>
				Start
			</button>
		{/if}

		{#if history.items.length > 0}
			<button
				type="button"
				onclick={openDrawer}
				class="text-muted hover:text-fg flex w-full items-center justify-center gap-2 px-5 py-3 text-xs transition-colors"
			>
				<Icon name="history" size={14} />
				{history.items.length} saved
			</button>
		{/if}
	</div>
</section>

<style>
	.spark-cta:hover {
		background-color: var(--color-spark);
		color: #fff;
	}
</style>
