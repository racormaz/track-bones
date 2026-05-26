<script lang="ts" module>
	import {
		RotateCw,
		Star,
		History,
		X,
		ChevronDown,
		ExternalLink,
		BookOpen,
		Play,
		MousePointerClick,
		Sparkle,
		Sparkles,
		Zap,
		Layers,
		Sliders,
		Link2,
		Lock,
		Music
	} from '@lucide/svelte';

	export const ICONS = {
		'rotate-cw': RotateCw,
		star: Star,
		history: History,
		x: X,
		'chevron-down': ChevronDown,
		'external-link': ExternalLink,
		'book-open': BookOpen,
		play: Play,
		'mouse-pointer-click': MousePointerClick,
		sparkle: Sparkle,
		sparkles: Sparkles,
		zap: Zap,
		layers: Layers,
		sliders: Sliders,
		link2: Link2,
		lock: Lock,
		music: Music
	} as const;

	export type IconName = keyof typeof ICONS;
</script>

<script lang="ts">
	let {
		name,
		size = 18,
		strokeWidth = 2,
		class: className = '',
		ariaLabel
	}: {
		name: IconName;
		size?: number;
		strokeWidth?: number;
		class?: string;
		ariaLabel?: string;
	} = $props();

	const SvgIcon = $derived(ICONS[name]);
	const hidden = $derived(ariaLabel ? undefined : true);
</script>

<SvgIcon
	{size}
	{strokeWidth}
	class={className}
	aria-hidden={hidden}
	aria-label={ariaLabel}
/>
