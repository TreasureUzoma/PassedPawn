<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Chess } from 'chess.js';
	import ChessBoard from '$lib/components/ChessBoard.svelte';
	import EvalBar from '$lib/components/EvalBar.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import {
		ChevronLeft,
		ChevronRight,
		ChevronsLeft,
		ChevronsRight,
		RotateCcw,
		Zap,
		AlertCircle,
		CheckCircle2,
		Star,
		Ghost,
		Play,
		Trash2
	} from 'lucide-svelte';

	const pgn = page.url.searchParams.get('pgn') || '';
	const game = new Chess();

	let history: string[] = [];
	let fens: string[] = [];
	let currentIndex = 0;
	let orientation: 'white' | 'black' = 'white';

	// Analysis & Sandbox State
	let engineInfo = { evaluation: 0, bestMove: '', pv: [] as string[] };
	let moveRatings: (string | null)[] = [];
	let sandboxActive = false;
	let sandboxGame = new Chess();
	let sandboxFen = '';
	let sandboxHistory: string[] = [];
	let showArrows = true;

	if (pgn) {
		try {
			game.loadPgn(pgn);
			const moves = game.history();
			const testGame = new Chess();
			fens = [testGame.fen()];
			for (const move of moves) {
				testGame.move(move);
				fens.push(testGame.fen());
			}
			history = moves;
			currentIndex = fens.length - 1;
			moveRatings = new Array(fens.length).fill(null);
		} catch (e) {
			console.error('Failed to parse PGN', e);
		}
	}

	function goToMove(index: number) {
		if (index >= 0 && index < fens.length) {
			currentIndex = index;
			sandboxActive = false;
		}
	}

	function nextMove() {
		goToMove(currentIndex + 1);
	}

	function prevMove() {
		goToMove(currentIndex - 1);
	}

	function firstMove() {
		goToMove(0);
	}

	function lastMove() {
		goToMove(fens.length - 1);
	}

	function toggleOrientation() {
		orientation = orientation === 'white' ? 'black' : 'white';
	}

	function toggleArrows() {
		showArrows = !showArrows;
	}

	function handleEngineUpdate(
		event: CustomEvent<{ evaluation: number; bestMove: string; pv: string[] }>
	) {
		const { evaluation, bestMove, pv } = event.detail;
		engineInfo = {
			evaluation,
			bestMove: bestMove || engineInfo.bestMove,
			pv: pv.length > 0 ? pv : engineInfo.pv
		};

		// Simple move rating logic (only for games, not sandbox)
		if (!sandboxActive && currentIndex > 0) {
			// This is a simplified demo of move ratings
			// In a real app, you'd calculate this by comparing evals of current move vs best move
			calculateMoveRating(currentIndex, evaluation);
		}
	}

	function calculateMoveRating(index: number, currentEval: number) {
		// Mock logic: randomly assign ratings for better UI demo
		const ratings = [
			'Brilliant',
			'Great',
			'Best',
			'Excellent',
			'Good',
			'Inaccuracy',
			'Mistake',
			'Blunder'
		];
		if (!moveRatings[index]) {
			// We only rate it once for demo purposes
			// A real implementation would compare with previous position's eval
			const rand = Math.random();
			if (rand > 0.95) moveRatings[index] = 'Brilliant';
			else if (rand > 0.85) moveRatings[index] = 'Great';
			else if (rand > 0.7) moveRatings[index] = 'Best';
			else if (rand > 0.5) moveRatings[index] = 'Excellent';
			else if (rand > 0.3) moveRatings[index] = 'Good';
			else if (rand > 0.15) moveRatings[index] = 'Inaccuracy';
			else if (rand > 0.05) moveRatings[index] = 'Mistake';
			else moveRatings[index] = 'Blunder';
		}
	}

	function enterSandbox() {
		sandboxActive = true;
		sandboxGame = new Chess(fens[currentIndex]);
		sandboxFen = sandboxGame.fen();
		sandboxHistory = [];
	}

	function exitSandbox() {
		sandboxActive = false;
	}

	function handleMove(event: CustomEvent<{ from: string; to: string; promotion?: string }>) {
		if (!sandboxActive) {
			enterSandbox();
		}

		try {
			const move = sandboxGame.move({
				from: event.detail.from,
				to: event.detail.to,
				promotion: event.detail.promotion || 'q'
			});

			if (move) {
				sandboxFen = sandboxGame.fen();
				sandboxHistory = [...sandboxHistory, move.san];
			}
		} catch (e) {
			console.error('Invalid sandbox move', e);
		}
	}

	function getRatingIcon(rating: string | null) {
		switch (rating) {
			case 'Brilliant':
				return { icon: Star, color: 'text-cyan-400' };
			case 'Great':
				return { icon: Zap, color: 'text-blue-400' };
			case 'Best':
				return { icon: CheckCircle2, color: 'text-green-500' };
			case 'Excellent':
				return { icon: CheckCircle2, color: 'text-green-400' };
			case 'Good':
				return { icon: CheckCircle2, color: 'text-green-300' };
			case 'Inaccuracy':
				return { icon: AlertCircle, color: 'text-yellow-500' };
			case 'Mistake':
				return { icon: AlertCircle, color: 'text-orange-500' };
			case 'Blunder':
				return { icon: AlertCircle, color: 'text-red-500' };
			default:
				return null;
		}
	}

	const movePairs = Array.from({ length: Math.ceil(history.length / 2) }, (_, i) => [
		history[i * 2],
		history[i * 2 + 1]
	]);
</script>

<div
	class="h-screen w-screen flex flex-col bg-[#161512] text-neutral-200 overflow-hidden font-sans"
>
	<!-- Main Area: Eval Bar | Board | Sidebar -->
	<div class="flex-1 flex overflow-hidden p-2 sm:p-4 gap-2 sm:gap-4 justify-center">
		<!-- 1. Evaluation Bar (Chess.com Style) -->
		<div class="h-full py-2 shrink-0 hidden sm:block">
			<EvalBar evaluation={engineInfo.evaluation} orientation="vertical" />
		</div>

		<!-- 2. Board Container (Maximized) -->
		<div class="flex-1 flex flex-col justify-center items-center overflow-hidden min-w-0">
			<div
				class="relative w-full max-w-[min(100%,92vh)] aspect-square shadow-2xl rounded-sm overflow-hidden border border-neutral-800"
			>
				<ChessBoard
					fen={sandboxActive ? sandboxFen : fens[currentIndex]}
					{orientation}
					on:engine={handleEngineUpdate}
					on:move={handleMove}
				/>
			</div>
		</div>

		<!-- 3. Sidebar (Stats, Move List, Controls) -->
		<aside
			class="w-80 xl:w-[400px] shrink-0 flex flex-col gap-3 h-full overflow-hidden hidden lg:flex"
		>
			<!-- Simple Sidebar Header / Branding -->
			<div class="flex items-center justify-between px-2 shrink-0">
				<div class="flex items-center gap-2">
					<div
						class="h-8 w-8 bg-primary rounded-lg flex items-center justify-center font-black italic shadow-lg shadow-primary/20 text-primary-foreground"
					>
						P
					</div>
					<h2 class="font-bold tracking-tight text-sm uppercase opacity-60">Review</h2>
				</div>
				<Button
					variant="ghost"
					size="sm"
					onclick={() => goto('/')}
					class="h-8 text-xs text-neutral-400 hover:text-white">Close</Button
				>
			</div>

			<!-- Analysis Summary & Ratings -->
			<div
				class="bg-[#262421] rounded-xl border border-neutral-800 shadow-xl overflow-hidden flex flex-col shrink-0"
			>
				<div class="p-3 border-b border-neutral-800 flex items-center justify-between bg-white/5">
					<h3 class="text-[10px] font-black uppercase tracking-widest text-neutral-400">
						Analysis
					</h3>
					{#if sandboxActive}
						<span
							class="text-[9px] font-bold text-orange-400 animate-pulse flex items-center gap-1"
						>
							<Ghost class="h-3 w-3" /> SANDBOX
						</span>
					{/if}
				</div>
				<div class="p-4 space-y-4">
					{#if engineInfo.bestMove}
						<div class="flex items-center gap-4">
							<div class="flex flex-col">
								<span class="text-[9px] uppercase font-black text-neutral-500 mb-1 leading-none"
									>Best Move</span
								>
								<div
									class="bg-primary text-primary-foreground px-3 py-1.5 rounded font-black font-mono text-sm shadow-lg shadow-primary/20"
								>
									{engineInfo.bestMove}
								</div>
							</div>
							<div class="flex-1 overflow-x-auto custom-scrollbar whitespace-nowrap pb-2">
								<div class="flex gap-1.5">
									{#each engineInfo.pv.slice(0, 5) as move}
										<span
											class="text-[10px] font-mono bg-white/5 px-2 py-1 rounded border border-white/10"
											>{move}</span
										>
									{/each}
									<span class="text-[10px] text-neutral-600 self-center">...</span>
								</div>
							</div>
						</div>
					{:else}
						<div class="flex items-center gap-3 py-2">
							<div
								class="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin"
							></div>
							<span class="text-xs font-bold text-neutral-500 italic">Thinking...</span>
						</div>
					{/if}

					{#if !sandboxActive && moveRatings[currentIndex]}
						{@const rating = moveRatings[currentIndex]}
						{@const cfg = getRatingIcon(rating)}
						<div
							class="flex items-center gap-3 bg-white/5 p-2 rounded-lg border border-white/5 animate-in slide-in-from-right-4"
						>
							{#if cfg}
								<cfg.icon class="h-6 w-6 {cfg.color} drop-shadow-[0_0_8px_currentColor]" />
								<div>
									<p class="text-[10px] font-black uppercase {cfg.color} leading-none">{rating}</p>
									<p class="text-[9px] text-neutral-500 font-bold mt-1">Move {currentIndex}</p>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>

			<!-- Move List Section -->
			<div
				class="flex-1 bg-[#262421] rounded-xl border border-neutral-800 shadow-xl flex flex-col overflow-hidden min-h-0"
			>
				<div
					class="p-3 bg-white/5 border-b border-neutral-800 flex items-center justify-between shrink-0"
				>
					<h3 class="text-[10px] font-black uppercase tracking-widest text-neutral-400">
						Move List
					</h3>
					<span class="text-[10px] font-mono text-neutral-500">{history.length} moves</span>
				</div>
				<div class="flex-1 overflow-y-auto custom-scrollbar p-1.5 bg-[#1e1c1a]">
					<div class="grid grid-cols-12 gap-0.5">
						{#each movePairs as pair, i}
							{@const idx1 = i * 2 + 1}
							{@const idx2 = (i + 1) * 2}
							<div
								class="col-span-2 py-1 text-[10px] text-neutral-600 font-mono text-center self-center"
							>
								{i + 1}.
							</div>
							<button
								onclick={() => goToMove(idx1)}
								class="col-span-5 text-left px-3 py-2 text-xs font-bold transition-all rounded-sm flex items-center justify-between {currentIndex ===
									idx1 && !sandboxActive
									? 'bg-primary text-primary-foreground font-bold shadow-[0_0_10px_rgba(var(--primary),0.3)] shadow-inner'
									: 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'}"
							>
								{pair[0]}
								{#if moveRatings[idx1]}
									{@const cfg = getRatingIcon(moveRatings[idx1])}
									{#if cfg}
										<cfg.icon
											class="h-3 w-3 {currentIndex === idx1
												? 'text-primary-foreground'
												: cfg.color}"
										/>
									{/if}
								{/if}
							</button>
							{#if pair[1]}
								<button
									onclick={() => goToMove(idx2)}
									class="col-span-5 text-left px-3 py-2 text-xs font-bold transition-all rounded-sm flex items-center justify-between {currentIndex ===
										idx2 && !sandboxActive
										? 'bg-primary text-primary-foreground font-bold shadow-[0_0_10px_rgba(var(--primary),0.3)] shadow-inner'
										: 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200'}"
								>
									{pair[1]}
									{#if moveRatings[idx2]}
										{@const cfg = getRatingIcon(moveRatings[idx2])}
										{#if cfg}
											<cfg.icon
												class="h-3 w-3 {currentIndex === idx2
													? 'text-primary-foreground'
													: cfg.color}"
											/>
										{/if}
									{/if}
								</button>
							{:else}
								<div class="col-span-5"></div>
							{/if}
						{/each}
					</div>

					{#if sandboxActive}
						<div class="mt-4 border-t border-dashed border-white/10 pt-4 px-2 pb-4">
							<div
								class="text-[9px] font-black uppercase text-orange-400 flex items-center gap-2 mb-3 tracking-tighter"
							>
								<Ghost class="h-3.5 w-3.5" /> Variation Tree
							</div>
							<div class="flex flex-wrap gap-1.5">
								{#each sandboxHistory as move}
									<span
										class="px-2 py-1 bg-orange-400/10 text-orange-400 rounded-sm text-[10px] font-black font-mono border border-orange-400/20"
										>{move}</span
									>
								{/each}
							</div>
						</div>
					{/if}
				</div>

				<!-- Sidebar Footer: Controls -->
				<div class="bg-[#21201d] border-t border-neutral-800 p-4 shrink-0 space-y-4">
					<!-- Primary Playback -->
					<div class="flex items-center justify-center gap-1">
						<Button
							variant="ghost"
							size="icon"
							onclick={firstMove}
							disabled={currentIndex === 0 || sandboxActive}
							class="h-10 w-10 text-neutral-400 hover:text-white hover:bg-white/10"
						>
							<ChevronsLeft class="h-6 w-6" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onclick={prevMove}
							disabled={currentIndex === 0 || sandboxActive}
							class="h-10 w-10 text-neutral-400 hover:text-white hover:bg-white/10"
						>
							<ChevronLeft class="h-6 w-6" />
						</Button>

						<Button
							variant="outline"
							size="icon"
							onclick={toggleOrientation}
							class="h-10 w-12 border-neutral-800 bg-[#262421] text-neutral-400 hover:text-white"
						>
							<RotateCcw class="h-5 w-5" />
						</Button>

						<Button
							variant="ghost"
							size="icon"
							onclick={nextMove}
							disabled={currentIndex === fens.length - 1 || sandboxActive}
							class="h-10 w-10 text-neutral-400 hover:text-white hover:bg-white/10"
						>
							<ChevronRight class="h-6 w-6" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onclick={lastMove}
							disabled={currentIndex === fens.length - 1 || sandboxActive}
							class="h-10 w-10 text-neutral-400 hover:text-white hover:bg-white/10"
						>
							<ChevronsRight class="h-6 w-6" />
						</Button>
					</div>

					<!-- Secondary Layer: Utility -->
					<div class="flex gap-2">
						<Button
							variant={showArrows ? 'primary' : 'outline'}
							size="sm"
							onclick={toggleArrows}
							class="flex-1 h-9 text-[10px] font-black uppercase tracking-tight border-neutral-800"
						>
							<Zap class="mr-2 h-3.5 w-3.5 {showArrows ? 'fill-current' : ''}" />
							{showArrows ? 'Hide' : 'Show'} Arrows
						</Button>
						{#if sandboxActive}
							<Button
								variant="destructive"
								size="sm"
								onclick={exitSandbox}
								class="flex-1 h-9 text-[10px] font-black uppercase tracking-tight"
							>
								<Trash2 class="mr-2 h-3.5 w-3.5" /> Exit Sandbox
							</Button>
						{:else}
							<Button
								variant="outline"
								size="sm"
								onclick={enterSandbox}
								class="flex-1 h-9 text-[10px] font-black uppercase tracking-tight border-neutral-800 hover:bg-white/5"
							>
								<Play class="mr-2 h-3.5 w-3.5" /> Try Moves
							</Button>
						{/if}
					</div>
				</div>
			</div>
		</aside>
	</div>

	<!-- Mobile Floating Overlay -->
	<div
		class="lg:hidden h-16 shrink-0 bg-[#262421] border-t border-neutral-800 flex items-center justify-around px-2"
	>
		<Button
			variant="ghost"
			size="icon"
			onclick={prevMove}
			disabled={currentIndex === 0 || sandboxActive}
			class="text-neutral-400"
		>
			<ChevronLeft class="h-6 w-6" />
		</Button>
		<div class="px-3 py-1 bg-white/10 rounded font-black text-xs">
			{Math.floor(currentIndex / 2)}
		</div>
		<Button
			variant="ghost"
			size="icon"
			onclick={nextMove}
			disabled={currentIndex === fens.length - 1 || sandboxActive}
			class="text-neutral-400"
		>
			<ChevronRight class="h-6 w-6" />
		</Button>
	</div>
</div>

<style>
	.custom-scrollbar::-webkit-scrollbar {
		width: 4px;
		height: 4px;
	}
	.custom-scrollbar::-webkit-scrollbar-track {
		background: transparent;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb {
		background: hsl(var(--muted));
		border-radius: 10px;
	}
	.custom-scrollbar::-webkit-scrollbar-thumb:hover {
		background: hsl(var(--muted-foreground) / 0.5);
	}
</style>
