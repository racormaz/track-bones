<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { history, deleteChallenge, clearHistory } from '$lib/stores/history.svelte';
	import { DIFFICULTY_LABELS } from '$lib/types';
	import genres from '$lib/content/genres.json';
	import type { Genre, Challenge } from '$lib/types';
	import Icon from './Icon.svelte';

	let { onClose, onOpen }: { onClose: () => void; onOpen: (c: Challenge) => void } = $props();

	const genreList = genres as Genre[];
	function genreLabel(id: string): string {
		return genreList.find((g) => g.id === id)?.label ?? id;
	}

	function formatTime(ts: number): string {
		const d = new Date(ts);
		return d.toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function confirmClear() {
		if (history.items.length === 0) return;
		if (confirm(`Delete all ${history.items.length} saved challenges?`)) clearHistory();
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape') onClose();
	}}
/>

<div
	class="fixed inset-0 z-40 bg-black/60"
	transition:fade={{ duration: 150 }}
	onclick={onClose}
	aria-hidden="true"
></div>

<aside
	class="fixed inset-x-0 bottom-0 z-50 flex max-h-[85svh] flex-col overflow-hidden rounded-t-2xl border-t border-border bg-bg"
	transition:fly={{ y: 400, duration: 220 }}
	style="padding-bottom: env(safe-area-inset-bottom);"
	aria-label="Saved challenges"
>
	<header class="flex items-center justify-between border-b border-border px-5 py-4">
		<h2 class="text-base font-semibold">History</h2>
		<div class="flex items-center gap-2">
			{#if history.items.length > 0}
				<button type="button" class="text-xs text-muted hover:text-fg" onclick={confirmClear}>
					Clear
				</button>
			{/if}
			<button
				type="button"
				aria-label="Close"
				class="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:text-fg"
				onclick={onClose}
			>
				<Icon name="x" size={20} />
			</button>
		</div>
	</header>

	<div class="overflow-y-auto px-5 py-3">
		{#if history.items.length === 0}
			<p class="py-12 text-center text-sm text-muted">
				No saved challenges yet. Tap ★ Save on a challenge you want to keep.
			</p>
		{:else}
			<ul class="flex flex-col gap-2 pb-4">
				{#each history.items as item (item.id)}
					<li class="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
						<button
							type="button"
							class="flex flex-1 flex-col items-start gap-1 text-left"
							onclick={() => onOpen(item)}
						>
							<span class="text-sm font-medium">{genreLabel(item.genre)}</span>
							<span class="text-xs text-muted">
								{DIFFICULTY_LABELS[item.difficulty]} · {formatTime(item.timestamp)}
							</span>
						</button>
						<button
							type="button"
							aria-label="Delete"
							class="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:text-fg"
							onclick={() => deleteChallenge(item.id)}
						>
							<Icon name="x" size={16} />
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</aside>
