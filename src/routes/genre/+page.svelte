<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import type { GenreId } from '$lib/types';
	import { preferences, setGenre } from '$lib/stores/preferences.svelte';
	import GenrePicker from '$lib/components/GenrePicker.svelte';

	onMount(() => {
		if (!preferences.lastMode) {
			goto(`${base}/mode`, { replaceState: true });
		}
	});

	function onSelect(g: GenreId) {
		setGenre(g);
		goto(`${base}/difficulty`);
	}
</script>

{#if preferences.lastMode}
	<div in:fade={{ duration: 150 }}>
		<GenrePicker selected={preferences.lastGenre} {onSelect} />
	</div>
{/if}
