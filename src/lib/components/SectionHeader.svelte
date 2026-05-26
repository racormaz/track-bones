<script lang="ts">
	let { label, barHint }: { label: string; barHint?: string } = $props();
</script>

<header class="flex items-baseline gap-2 px-1 pt-3 pb-1">
	<span class="text-[10px] font-semibold tracking-[0.2em] text-muted uppercase">{label}</span>
	<span class="h-px flex-1 bg-border/60" aria-hidden="true"></span>
	{#if barHint}
		<span class="text-[10px] text-muted/60">{barHint}</span>
	{/if}
</header>
