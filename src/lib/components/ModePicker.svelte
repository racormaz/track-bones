<script lang="ts">
	import type { Mode } from '$lib/types';
	import Icon, { type IconName } from './Icon.svelte';

	let {
		selected,
		onSelect
	}: { selected: Mode | null; onSelect: (m: Mode) => void } = $props();

	const items: { value: Mode; label: string; icon: IconName; blurb: string }[] = [
		{
			value: 'quick',
			label: 'Quick',
			icon: 'zap',
			blurb: '5 starting constraints. Fast inspiration.'
		},
		{
			value: 'deep',
			label: 'Deep',
			icon: 'layers',
			blurb: 'Same constraints, arranged into a track shape with synergies.'
		}
	];
</script>

<section class="flex flex-col gap-6 px-5 pt-10 pb-32">
	<header class="flex flex-col gap-2">
		<p class="text-xs tracking-[0.2em] text-muted uppercase">Start</p>
		<h2 class="text-2xl font-semibold tracking-tight">Pick a mode</h2>
		<p class="text-sm text-muted">You can change this any time.</p>
	</header>

	<ul class="flex flex-col gap-3">
		{#each items as item (item.value)}
			<li>
				<button
					type="button"
					class="flex w-full items-start gap-4 rounded-[var(--radius-card)] border border-border bg-card px-5 py-5 text-left transition-colors hover:bg-card-2 aria-pressed:border-accent aria-pressed:bg-accent/15"
					aria-pressed={selected === item.value}
					onclick={() => onSelect(item.value)}
				>
					<span class="mt-0.5 text-accent">
						<Icon name={item.icon} size={22} />
					</span>
					<span class="flex flex-1 flex-col gap-1">
						<span class="text-base font-semibold">{item.label}</span>
						<span class="text-xs text-muted">{item.blurb}</span>
					</span>
				</button>
			</li>
		{/each}
	</ul>
</section>
