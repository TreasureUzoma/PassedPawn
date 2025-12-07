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
		// Example puzzle: Mate in 2
		fen = 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4';
	}
</script>

<div class="min-h-screen w-full bg-neutral-900 p-8 text-neutral-100">
	<div
		class="mx-auto flex max-w-6xl flex-col items-center gap-12 lg:flex-row lg:items-start lg:justify-center"
	>
		<div class="flex w-full max-w-2xl flex-col gap-4">
			<h1 class="text-3xl font-bold tracking-tight">Chess Board Component</h1>
			<p class="text-neutral-400">
				A reusable, responsive chess board component built with Svelte and Tailwind CSS. Supports
				FEN strings and orientation flipping.
			</p>

			<div class="flex justify-center bg-transparent">
				<ChessBoard {fen} {orientation} />
			</div>
		</div>

		<div
			class="flex w-full max-w-sm flex-col gap-6 rounded-xl border border-neutral-800 bg-neutral-950 p-6 shadow-xl"
		>
			<h2 class="text-xl font-semibold">Controls</h2>

			<div class="space-y-4">
				<div class="flex flex-col gap-2">
					<label class="text-sm font-medium text-neutral-400" for="fen">FEN String</label>
					<input
						id="fen"
						type="text"
						bind:value={fen}
						class="w-full rounded bg-neutral-900 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-600 outline-none ring-1 ring-neutral-800 focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				<div class="flex flex-col gap-2">
					<span class="text-sm font-medium text-neutral-400">Actions</span>
					<div class="grid grid-cols-2 gap-2">
						<button
							on:click={toggleOrientation}
							class="rounded bg-neutral-800 px-4 py-2 text-sm font-medium hover:bg-neutral-700 active:bg-neutral-600"
						>
							Flip Board
						</button>
						<button
							on:click={resetBoard}
							class="rounded bg-neutral-800 px-4 py-2 text-sm font-medium hover:bg-neutral-700 active:bg-neutral-600"
						>
							Reset
						</button>
					</div>
					<button
						on:click={setPuzzle}
						class="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 active:bg-blue-700"
					>
						Load "Scholar's Mate"
					</button>
				</div>
			</div>
		</div>
	</div>
</div>
