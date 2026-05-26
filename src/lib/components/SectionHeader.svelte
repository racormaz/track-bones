<script lang="ts">
	import type { SecondaryRef, RefKind } from '$lib/types';
	import Icon, { type IconName } from './Icon.svelte';

	let {
		label,
		description,
		barHint,
		ref
	}: {
		label: string;
		description?: string;
		barHint?: string;
		ref?: SecondaryRef;
	} = $props();

	const REF_KIND_ICON: Record<RefKind, IconName> = {
		article: 'book-open',
		video: 'play',
		interactive: 'mouse-pointer-click'
	};
</script>

<div class="flex flex-col gap-1.5 px-1 pt-3 pb-1">
	<header class="flex items-baseline gap-2">
		<span class="text-[10px] font-semibold tracking-[0.2em] text-muted uppercase">{label}</span>
		<span class="h-px flex-1 bg-border/60" aria-hidden="true"></span>
		{#if barHint}
			<span class="text-[10px] text-muted/60">{barHint}</span>
		{/if}
	</header>
	{#if description}
		<p class="text-xs leading-relaxed text-muted">
			{description}
			{#if ref}
				<a
					href={ref.url}
					target="_blank"
					rel="noopener noreferrer"
					class="ml-1 inline-flex items-center gap-1 align-middle text-accent hover:underline"
				>
					<Icon name={REF_KIND_ICON[ref.kind]} size={11} />
					<span>{ref.label}</span>
					<Icon name="external-link" size={10} />
				</a>
			{/if}
		</p>
	{/if}
</div>
