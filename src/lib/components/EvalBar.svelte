<script lang="ts">
	let {
		evaluation = 0,
		orientation = 'vertical'
	}: { evaluation?: number; orientation?: 'vertical' | 'horizontal' } = $props();

	let clampedEval = $derived(Math.max(-10, Math.min(10, evaluation)));
	// Percentage for white's advantage (0 to 100)
	// +10 -> 100%, 0 -> 50%, -10 -> 0%
	let whitePercent = $derived(((clampedEval + 10) / 20) * 100);
</script>

<div
	class="bg-neutral-800 rounded overflow-hidden flex relative ring-1 ring-neutral-700
    {orientation === 'vertical' ? 'flex-col-reverse h-full w-6' : 'flex-row h-6 w-full'}"
>
	<!-- White Bar -->
	<div
		class="bg-white transition-all duration-500 ease-in-out"
		style="{orientation === 'vertical'
			? `height: ${whitePercent}%`
			: `width: ${whitePercent}%`}; {orientation === 'vertical' ? 'width: 100%' : 'height: 100%'}"
	></div>

	<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
		<span class="text-[10px] font-bold mix-blend-difference text-white">
			{evaluation > 0 ? '+' : ''}{evaluation}
		</span>
	</div>
</div>
