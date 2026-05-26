<script lang="ts">
	import { fade } from 'svelte/transition';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import type { Mode } from '$lib/types';
	import { preferences, setMode } from '$lib/stores/preferences.svelte';
	import ModePicker from '$lib/components/ModePicker.svelte';

	function onSelect(m: Mode) {
		setMode(m);
		goto(`${base}/genre`);
	}
</script>

<div in:fade={{ duration: 150 }}>
	<ModePicker selected={preferences.lastMode} {onSelect} />
</div>
