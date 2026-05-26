<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { fade } from 'svelte/transition';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import HistoryDrawer from '$lib/components/HistoryDrawer.svelte';
	import { uiState, closeDrawer } from '$lib/stores/ui.svelte';
	import type { Challenge } from '$lib/types';

	let { children } = $props();

	function onOpenFromHistory(c: Challenge) {
		closeDrawer();
		if (c.encoded) {
			goto(`${base}/c/${c.encoded}`);
		} else {
			// Pre-encoded entries: fall back to mode picker — they predate this version.
			goto(`${base}/mode`);
		}
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="mx-auto max-w-2xl">
	<header class="px-5 pt-6 pb-1">
		<a href={`${base}/`} class="inline-flex items-center gap-2">
			<span class="inline-block h-2 w-2 rounded-full bg-accent" aria-hidden="true"></span>
			<span class="text-sm font-semibold tracking-tight text-fg">Track Bones</span>
		</a>
	</header>

	{@render children()}
</div>

{#if uiState.drawerOpen}
	<HistoryDrawer onClose={closeDrawer} onOpen={onOpenFromHistory} />
{/if}

{#if uiState.toast}
	<div
		class="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-accent px-4 py-2 text-xs font-medium text-accent-fg shadow-lg"
		transition:fade={{ duration: 120 }}
	>
		{uiState.toast}
	</div>
{/if}
