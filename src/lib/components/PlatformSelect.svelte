<script lang="ts">
	import { cn } from '$lib/utils';

	let {
		selectedPlatform = 'chess.com',
		onPlatformChange
	}: { selectedPlatform: 'chess.com' | 'pgn'; onPlatformChange: (p: 'chess.com' | 'pgn') => void } =
		$props();
</script>

<div class={cn('flex items-center p-1 bg-muted rounded-lg border border-border w-full max-w-md')}>
	<button
		onclick={() => onPlatformChange('chess.com')}
		class={cn(
			'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
			selectedPlatform === 'chess.com'
				? 'bg-background text-foreground shadow-sm'
				: 'text-muted-foreground hover:text-foreground'
		)}
	>
		Chess.com
	</button>
	<button
		onclick={() => onPlatformChange('pgn')}
		class={cn(
			'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
			selectedPlatform === 'pgn'
				? 'bg-background text-foreground shadow-sm'
				: 'text-muted-foreground hover:text-foreground'
		)}
	>
		Paste PGN
	</button>
</div>
