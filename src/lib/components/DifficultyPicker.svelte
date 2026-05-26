<script lang="ts">
	import type { Difficulty } from '$lib/types';
	import { DIFFICULTY_LABELS } from '$lib/types';

	let { selected, onSelect }: { selected: Difficulty | null; onSelect: (d: Difficulty) => void } =
		$props();

	const items: { value: Difficulty; label: string; blurb: string }[] = [
		{ value: 1, label: DIFFICULTY_LABELS[1], blurb: 'Common, well-known techniques.' },
		{ value: 2, label: DIFFICULTY_LABELS[2], blurb: 'Stuff a working producer would recognize.' },
		{ value: 3, label: DIFFICULTY_LABELS[3], blurb: 'Niche, obscure, vocabulary-stretching.' }
	];
</script>

<section class="flex flex-col gap-6 px-5 pt-10 pb-32">
	<header class="flex flex-col gap-2">
		<p class="text-xs tracking-[0.2em] text-muted uppercase">Step 2 of 2</p>
		<h2 class="text-2xl font-semibold tracking-tight">How hard?</h2>
		<p class="text-sm text-muted">Higher tiers unlock obscurer concepts on top of easier ones.</p>
	</header>

	<ul class="flex flex-col gap-2">
		{#each items as item (item.value)}
			<li>
				<button
					type="button"
					class="flex w-full flex-col items-start gap-1 rounded-[var(--radius-card)] border border-border bg-card px-5 py-4 text-left transition-colors hover:bg-card-2 aria-pressed:border-accent aria-pressed:bg-accent/15"
					aria-pressed={selected === item.value}
					onclick={() => onSelect(item.value)}
				>
					<span class="text-base font-semibold">{item.label}</span>
					<span class="text-xs text-muted">{item.blurb}</span>
				</button>
			</li>
		{/each}
	</ul>
</section>
