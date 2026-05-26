<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import type { Difficulty, Concept, Genre, Combo } from '$lib/types';
	import conceptsRaw from '$lib/content/concepts.json';
	import genresRaw from '$lib/content/genres.json';
	import combosRaw from '$lib/content/combos.json';
	import {
		preferences,
		setDifficulty,
		setCombosEnabled,
		combosResolved
	} from '$lib/stores/preferences.svelte';
	import { recentConceptIds } from '$lib/stores/history.svelte';
	import {
		generateChallenge,
		generateChallengeWithCombo,
		pickTemplate,
		generateDeepChallenge,
		findActiveCombo
	} from '$lib/challenge/generator';
	import { encodeChallenge } from '$lib/challenge/encode';
	import { showToast } from '$lib/stores/ui.svelte';
	import DifficultyPicker from '$lib/components/DifficultyPicker.svelte';

	const concepts = conceptsRaw as Concept[];
	const genres = genresRaw as Genre[];
	const combos = combosRaw as Combo[];
	const genresById = new Map(genres.map((g) => [g.id, g] as const));

	onMount(() => {
		if (!preferences.lastMode) {
			goto(`${base}/mode`, { replaceState: true });
		} else if (!preferences.lastGenre) {
			goto(`${base}/genre`, { replaceState: true });
		}
	});

	function generateAndGo() {
		if (!preferences.lastMode || !preferences.lastGenre || !preferences.lastDifficulty) return;
		try {
			let encoded: string;

			if (preferences.lastMode === 'quick') {
				const conceptIds = generateChallenge({
					concepts,
					genre: preferences.lastGenre,
					difficulty: preferences.lastDifficulty,
					excludeIds: recentConceptIds(10)
				});
				encoded = encodeChallenge({
					mode: 'quick',
					genre: preferences.lastGenre,
					difficulty: preferences.lastDifficulty,
					conceptIds
				});
			} else {
				// Deep mode
				const genre = genresById.get(preferences.lastGenre);
				const template = pickTemplate(genre?.templates);
				if (!template) {
					// No template, fall back to quick.
					const conceptIds = generateChallenge({
						concepts,
						genre: preferences.lastGenre,
						difficulty: preferences.lastDifficulty,
						excludeIds: recentConceptIds(10)
					});
					encoded = encodeChallenge({
						mode: 'quick',
						genre: preferences.lastGenre,
						difficulty: preferences.lastDifficulty,
						conceptIds
					});
					showToast('No template for this genre. Showing flat brief.');
				} else {
					const deep = generateDeepChallenge({
						concepts,
						template,
						genre: preferences.lastGenre,
						difficulty: preferences.lastDifficulty,
						excludeIds: recentConceptIds(10)
					});

					let activeComboId: string | undefined;
					if (combosResolved()) {
						const flatIds = [
							...(deep.framingConceptId ? [deep.framingConceptId] : []),
							...deep.sectionPicks.map((p) => p.conceptId)
						];
						const combo = findActiveCombo({
							combos,
							picked: flatIds,
							genre: preferences.lastGenre,
							difficulty: preferences.lastDifficulty
						});
						activeComboId = combo?.id;

						// If no natural combo, try generating one to bias toward.
						if (!combo) {
							const comboResult = generateChallengeWithCombo({
								concepts,
								combos,
								genre: preferences.lastGenre,
								difficulty: preferences.lastDifficulty,
								excludeIds: recentConceptIds(10)
							});
							if (comboResult.comboId) {
								// Use the combo-biased picks if they fit; else stick with deep.
								// Simplest path: re-run deep with combo-aware excludes (deferred — keep simple for v2.2).
								activeComboId = comboResult.comboId;
							}
						}
					}

					encoded = encodeChallenge({
						mode: 'deep',
						genre: preferences.lastGenre,
						difficulty: preferences.lastDifficulty,
						conceptIds: [
							...(deep.framingConceptId ? [deep.framingConceptId] : []),
							...deep.sectionPicks.map((p) => p.conceptId)
						],
						templateId: template.id,
						framingConceptId: deep.framingConceptId,
						deepSectionPicks: deep.sectionPicks,
						comboId: activeComboId
					});
				}
			}

			goto(`${base}/c/${encoded}`);
		} catch (err) {
			console.error(err);
			showToast('Content library is empty or too sparse.');
		}
	}

	function onSelect(d: Difficulty) {
		setDifficulty(d);
		generateAndGo();
	}

	function onCombosToggle(enabled: boolean) {
		setCombosEnabled(enabled);
	}
</script>

{#if preferences.lastMode && preferences.lastGenre}
	<div in:fade={{ duration: 150 }}>
		<DifficultyPicker
			selected={preferences.lastDifficulty}
			mode={preferences.lastMode}
			combosEnabled={combosResolved()}
			{onSelect}
			{onCombosToggle}
		/>
	</div>
{/if}
