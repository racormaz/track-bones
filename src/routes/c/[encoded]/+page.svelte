<script lang="ts">
	import { fade } from 'svelte/transition';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type {
		Concept,
		Genre,
		Combo,
		Mode,
		GenreId,
		Difficulty,
		SectionId,
		SectionTemplate
	} from '$lib/types';
	import { CATEGORIES } from '$lib/types';
	import conceptsRaw from '$lib/content/concepts.json';
	import genresRaw from '$lib/content/genres.json';
	import combosRaw from '$lib/content/combos.json';
	import { recentConceptIds, saveChallenge } from '$lib/stores/history.svelte';
	import { encodeChallenge, decodeChallenge } from '$lib/challenge/encode';
	import {
		rerollOne,
		rerollSectionPick,
		rerollFraming,
		generateChallenge,
		generateDeepChallenge,
		pickTemplate,
		findActiveCombo
	} from '$lib/challenge/generator';
	import { openDrawer, showToast } from '$lib/stores/ui.svelte';
	import ChallengeView from '$lib/components/ChallengeView.svelte';

	const concepts = conceptsRaw as Concept[];
	const conceptsById = new Map(concepts.map((c) => [c.id, c] as const));
	const genres = genresRaw as Genre[];
	const genresById = new Map(genres.map((g) => [g.id, g] as const));
	const combos = combosRaw as Combo[];
	const combosById = new Map(combos.map((c) => [c.id, c] as const));

	// Decode the URL slug into challenge state. Reactive on URL change.
	const decoded = $derived.by(() => {
		const encoded = page.params.encoded;
		if (!encoded) return null;
		const payload = decodeChallenge(encoded);
		if (!payload) return null;
		return { encoded, payload };
	});

	// Redirect to /mode if decode failed.
	$effect(() => {
		if (!decoded) {
			showToast('That link looks broken.');
			goto(`${base}/mode`, { replaceState: true });
		}
	});

	// Derived state from the decoded payload.
	const mode = $derived(decoded?.payload.mode);
	const genre = $derived(decoded?.payload.genre);
	const difficulty = $derived(decoded?.payload.difficulty);
	const conceptIds = $derived(decoded?.payload.conceptIds ?? []);
	const deepSectionPicks = $derived(decoded?.payload.deepSectionPicks ?? []);
	const framingConceptId = $derived(decoded?.payload.framingConceptId ?? null);
	const comboId = $derived(decoded?.payload.comboId);

	const template = $derived.by(() => {
		if (!decoded || decoded.payload.mode !== 'deep' || !decoded.payload.templateId) return null;
		const g = genresById.get(decoded.payload.genre);
		return g?.templates?.find((t) => t.id === decoded.payload.templateId) ?? null;
	});

	const framingConcept = $derived(framingConceptId ? (conceptsById.get(framingConceptId) ?? null) : null);
	const activeCombo = $derived(comboId ? (combosById.get(comboId) ?? null) : null);

	function replaceUrl(payload: Parameters<typeof encodeChallenge>[0]) {
		const newEncoded = encodeChallenge(payload);
		goto(`${base}/c/${newEncoded}`, { replaceState: true });
	}

	function onRerollOne(index: number) {
		if (!genre || !difficulty || mode !== 'quick') return;
		const category = CATEGORIES[index];
		const currentId = conceptIds[index];
		try {
			const newId = rerollOne({
				concepts,
				genre,
				difficulty,
				category,
				currentId,
				excludeIds: [...conceptIds, ...recentConceptIds(10)]
			});
			const newIds = conceptIds.map((id, i) => (i === index ? newId : id));
			replaceUrl({ mode: 'quick', genre, difficulty, conceptIds: newIds, comboId });
		} catch (err) {
			console.error(err);
			showToast('No alternatives left for this slot.');
		}
	}

	function onRerollSection(sectionId: SectionId) {
		if (!template || !genre || !difficulty || mode !== 'deep') return;
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
				genre,
				difficulty,
				excludeIds: recentConceptIds(10)
			});
			const newPicks = deepSectionPicks.map((p) =>
				p.sectionId === sectionId ? { ...p, conceptId: newId } : p
			);
			const flatIds = [
				...(framingConceptId ? [framingConceptId] : []),
				...newPicks.map((p) => p.conceptId)
			];
			const refreshedComboId = findActiveCombo({
				combos,
				picked: flatIds,
				genre,
				difficulty
			})?.id;
			replaceUrl({
				mode: 'deep',
				genre,
				difficulty,
				conceptIds: flatIds,
				templateId: template.id,
				framingConceptId,
				deepSectionPicks: newPicks,
				comboId: refreshedComboId
			});
		} catch (err) {
			console.error(err);
			showToast('No alternatives left for this section.');
		}
	}

	function onRerollFraming() {
		if (!template || !genre || !difficulty || mode !== 'deep') return;
		try {
			const newId = rerollFraming({
				concepts,
				template,
				currentId: framingConceptId,
				pickedIds: deepSectionPicks.map((p) => p.conceptId),
				genre,
				difficulty,
				excludeIds: recentConceptIds(10)
			});
			const flatIds = [
				...(newId ? [newId] : []),
				...deepSectionPicks.map((p) => p.conceptId)
			];
			const refreshedComboId = findActiveCombo({
				combos,
				picked: flatIds,
				genre,
				difficulty
			})?.id;
			replaceUrl({
				mode: 'deep',
				genre,
				difficulty,
				conceptIds: flatIds,
				templateId: template.id,
				framingConceptId: newId,
				deepSectionPicks,
				comboId: refreshedComboId
			});
		} catch (err) {
			console.error(err);
			showToast('No alternative framing available.');
		}
	}

	function onRerollAll() {
		if (!mode || !genre || !difficulty) return;
		try {
			if (mode === 'quick') {
				const ids = generateChallenge({
					concepts,
					genre,
					difficulty,
					excludeIds: recentConceptIds(10)
				});
				replaceUrl({ mode: 'quick', genre, difficulty, conceptIds: ids });
			} else {
				const g = genresById.get(genre);
				const newTemplate = pickTemplate(g?.templates);
				if (!newTemplate) {
					showToast('No template for this genre.');
					return;
				}
				const deep = generateDeepChallenge({
					concepts,
					template: newTemplate,
					genre,
					difficulty,
					excludeIds: recentConceptIds(10)
				});
				const flatIds = [
					...(deep.framingConceptId ? [deep.framingConceptId] : []),
					...deep.sectionPicks.map((p) => p.conceptId)
				];
				const refreshedComboId = findActiveCombo({
					combos,
					picked: flatIds,
					genre,
					difficulty
				})?.id;
				replaceUrl({
					mode: 'deep',
					genre,
					difficulty,
					conceptIds: flatIds,
					templateId: newTemplate.id,
					framingConceptId: deep.framingConceptId,
					deepSectionPicks: deep.sectionPicks,
					comboId: refreshedComboId
				});
			}
		} catch (err) {
			console.error(err);
			showToast('Content library is empty or too sparse.');
		}
	}

	function onSave() {
		if (!mode || !genre || !difficulty) return;
		saveChallenge({
			mode,
			genre,
			difficulty,
			conceptIds,
			templateId: template?.id,
			deepSectionPicks: mode === 'deep' ? deepSectionPicks : undefined,
			framingConceptId: framingConceptId ?? undefined,
			comboId,
			encoded: decoded?.encoded
		});
		showToast('Saved to history');
	}

	function onChangePrefs() {
		goto(`${base}/mode`);
	}
</script>

{#if decoded && mode && genre && difficulty}
	<div in:fade={{ duration: 150 }}>
		<ChallengeView
			{conceptIds}
			{conceptsById}
			{mode}
			{genre}
			{difficulty}
			{template}
			{deepSectionPicks}
			{framingConcept}
			combo={activeCombo}
			{onRerollSection}
			{onRerollFraming}
			{onRerollOne}
			{onRerollAll}
			{onSave}
			onShowHistory={openDrawer}
			{onChangePrefs}
		/>
	</div>
{/if}
