<script lang="ts">
	import genres from '$lib/content/genres.json';
	import type { Genre, GenreId } from '$lib/types';

	let { selected, onSelect }: { selected: GenreId | null; onSelect: (g: GenreId) => void } =
		$props();

	const list = genres as Genre[];
</script>

<section class="flex flex-col gap-6 px-5 pt-10 pb-32">
	<header class="flex flex-col gap-2">
		<p class="text-xs tracking-[0.2em] text-muted uppercase">Step 1 of 2</p>
		<h2 class="text-2xl font-semibold tracking-tight">Pick a genre</h2>
		<p class="text-sm text-muted">Drives which constraints you'll be challenged with.</p>
	</header>

	<ul class="grid grid-cols-2 gap-2 sm:grid-cols-3">
		{#each list as g (g.id)}
			<li>
				<button
					type="button"
					class="w-full rounded-[var(--radius-card)] border border-border bg-card px-4 py-3.5 text-left text-sm font-medium transition-colors hover:bg-card-2 aria-pressed:border-accent aria-pressed:bg-accent/15 aria-pressed:text-fg"
					aria-pressed={selected === g.id}
					onclick={() => onSelect(g.id)}
				>
					{g.label}
				</button>
			</li>
		{/each}
	</ul>
</section>
