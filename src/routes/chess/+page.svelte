<script lang="ts">
	import ChessBoard from '$lib/components/ChessBoard.svelte';

	let orientation: 'white' | 'black' = 'white';
	let fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

	function toggleOrientation() {
		orientation = orientation === 'white' ? 'black' : 'white';
	}

	function resetBoard() {
		fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
	}

	function setPuzzle() {
		fen = 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4';
	}
</script>

<div class="w-full p-0 sm:p-8 py-8">
	<div
		class="mx-auto flex max-w-6xl flex-col items-center gap-12 lg:flex-row lg:items-start lg:justify-center"
	>
		<div class="flex w-full flex-col gap-4 lg:max-w-2xl">
			<div class="flex flex-col gap-2 mx-4 md:mx-0">
				<h1 class="text-3xl font-bold tracking-tight">Chess Board Component</h1>
				<p class="text-muted-foreground">
					A reusable, responsive chess board component built with Svelte and Tailwind CSS. Supports
					FEN strings and orientation flipping.
				</p>
			</div>

			<div class="flex justify-center bg-transparent w-full">
				<ChessBoard {fen} {orientation} />
			</div>
		</div>
		<div class="flex w-full lg:max-w-2xl px-4 md:px-0 items-center">
			<div
				class="flex w-full max-w-sm flex-col gap-6 rounded-xl border border-border bg-card p-6 shadow-xl m-auto"
			>
				<h2 class="text-xl font-semibold">Controls</h2>

				<div class="space-y-4">
					<div class="flex flex-col gap-2">
						<label class="text-sm font-medium text-muted-foreground" for="fen">FEN String</label>
						<input
							id="fen"
							type="text"
							bind:value={fen}
							class="w-full rounded bg-muted px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none ring-1 ring-border focus:ring-2 focus:ring-primary"
						/>
					</div>

					<div class="flex flex-col gap-2">
						<span class="text-sm font-medium text-muted-foreground">Actions</span>
						<div class="grid grid-cols-2 gap-2">
							<button
								on:click={toggleOrientation}
								class="rounded bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 active:opacity-90 transition-colors"
							>
								Flip Board
							</button>
							<button
								on:click={resetBoard}
								class="rounded bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 active:opacity-90 transition-colors"
							>
								Reset
							</button>
						</div>
						<button
							on:click={setPuzzle}
							class="w-full rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:opacity-90 transition-colors"
						>
							Load "Scholar's Mate"
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
