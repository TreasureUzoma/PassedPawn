<script lang="ts">
	import { onMount } from 'svelte';
	import {
		ChessPawn,
		ChessKnight,
		ChessBishop,
		ChessRook,
		ChessQueen,
		ChessKing,
		Trophy
	} from '@lucide/svelte';
	import { Chess } from 'chess.js';
	import type { Square, Move } from 'chess.js';

	export let fen: string = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
	export let orientation: 'white' | 'black' = 'white';

	let chess = new Chess(fen);
	let board = chess.board();

	let isCheckmate = false;
	let isCheck = false;
	let turn = 'w';
	let winner: 'White' | 'Black' | null = null;
	let kingSquare: Square | null = null;

	// Sync logic
	$: {
		if (fen !== chess.fen()) {
			try {
				chess.load(fen);
				updateGameState();
			} catch (e) {
				console.error('Invalid FEN', e);
			}
		}
	}

	onMount(() => {
		updateGameState();
	});

	$: rows = orientation === 'white' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
	$: cols = orientation === 'white' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

	// Dragging State
	let draggedPiece: {
		row: number;
		col: number;
		square: Square;
		type: string;
		color: 'w' | 'b';
		x: number;
		y: number;
	} | null = null;

	let possibleMoves: string[] = [];
	let capturedPieces: { w: string[]; b: string[] } = { w: [], b: [] };

	let boardElement: HTMLElement;

	function updateGameState() {
		board = chess.board();
		capturedPieces = getCapturedPieces();
		isCheckmate = chess.isCheckmate();
		isCheck = chess.inCheck();
		turn = chess.turn(); // 'w' or 'b'

		// Find King of current turn if in check
		kingSquare = null;
		if (isCheck || isCheckmate) {
			// Find the king of the current turn (who is in danger)
			// 'board' is 0-indexed rows [0..7] from top (8 -> 1)
			// We need to traverse to find the king.
			let found = false;
			for (let r = 0; r < 8; r++) {
				for (let c = 0; c < 8; c++) {
					const p = board[r][c];
					if (p && p.type === 'k' && p.color === turn) {
						kingSquare = getSquare(r, c);
						found = true;
						break;
					}
				}
				if (found) break;
			}
		}

		if (isCheckmate) {
			winner = turn === 'w' ? 'Black' : 'White';
		} else {
			winner = null;
		}
	}

	function getPieceColorClasses(color: string) {
		return color === 'w' ? 'stroke-neutral-900 fill-white' : 'stroke-white fill-neutral-900';
	}

	function getCapturedPieces() {
		const history = chess.history({ verbose: true });
		const captured = { w: [] as string[], b: [] as string[] };

		for (const move of history) {
			if (move.captured) {
				const capturedColor = move.color === 'w' ? 'b' : 'w';
				captured[capturedColor].push(move.captured);
			}
		}

		const order = ['p', 'n', 'b', 'r', 'q'];
		captured.w.sort((a, b) => order.indexOf(a) - order.indexOf(b));
		captured.b.sort((a, b) => order.indexOf(a) - order.indexOf(b));

		return captured;
	}

	function handleMouseDown(
		e: MouseEvent,
		row: number,
		col: number,
		piece: { type: string; color: 'w' | 'b' } | null
	) {
		if (isCheckmate) return; // Game over
		if (!piece || chess.turn() !== piece.color) return;
		e.preventDefault();

		const square = getSquare(row, col);
		const moves = chess.moves({ square, verbose: true });
		possibleMoves = moves.map((m) => m.to);

		draggedPiece = {
			row,
			col,
			square,
			type: piece.type,
			color: piece.color,
			x: e.clientX,
			y: e.clientY
		};

		window.addEventListener('mousemove', handleMouseMove);
		window.addEventListener('mouseup', handleMouseUp);
	}

	function handleMouseMove(e: MouseEvent) {
		if (!draggedPiece) return;
		draggedPiece = { ...draggedPiece, x: e.clientX, y: e.clientY };
	}

	function handleMouseUp(e: MouseEvent) {
		if (!draggedPiece) {
			possibleMoves = [];
			return;
		}

		if (boardElement) {
			const boardRect = boardElement.getBoundingClientRect();
			const squareSize = boardRect.width / 8;

			const relativeX = e.clientX - boardRect.left;
			const relativeY = e.clientY - boardRect.top;

			if (
				relativeX >= 0 &&
				relativeX <= boardRect.width &&
				relativeY >= 0 &&
				relativeY <= boardRect.height
			) {
				const targetColIdx = Math.floor(relativeX / squareSize);
				const targetRowIdx = Math.floor(relativeY / squareSize);

				const actualRow = orientation === 'white' ? targetRowIdx : 7 - targetRowIdx;
				const actualCol = orientation === 'white' ? targetColIdx : 7 - targetColIdx;

				const targetSquare = getSquare(actualRow, actualCol);

				try {
					const move = chess.move({
						from: draggedPiece.square,
						to: targetSquare,
						promotion: 'q'
					});

					if (move) {
						fen = chess.fen();
						updateGameState();
					}
				} catch (err) {
					// Invalid move
				}
			}
		}

		cleanupDrag();
	}

	function cleanupDrag() {
		draggedPiece = null;
		possibleMoves = [];
		window.removeEventListener('mousemove', handleMouseMove);
		window.removeEventListener('mouseup', handleMouseUp);
	}

	function getSquare(row: number, col: number): Square {
		const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
		const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
		return `${files[col]}${ranks[row]}` as Square;
	}

	const pieceComponents: Record<string, any> = {
		p: ChessPawn,
		n: ChessKnight,
		b: ChessBishop,
		r: ChessRook,
		q: ChessQueen,
		k: ChessKing
	};
</script>

<div class="flex flex-col gap-4 w-full max-w-2xl">
	<!-- Captured Pieces (Top - Opponent) -->
	<div class="flex h-8 w-full items-center gap-1 rounded bg-neutral-900/50 px-2 min-h-[32px]">
		{#each orientation === 'white' ? capturedPieces.w : capturedPieces.b as piece}
			{@const Component = pieceComponents[piece]}
			<div class="relative h-6 w-6">
				<svelte:component
					this={Component}
					size="100%"
					class="drop-shadow-sm filter {getPieceColorClasses(orientation === 'white' ? 'w' : 'b')}"
					strokeWidth={1.5}
				/>
			</div>
		{/each}
	</div>

	<div
		bind:this={boardElement}
		class="aspect-square w-full select-none rounded-lg shadow-2xl relative overflow-hidden ring-4 ring-neutral-800"
	>
		<div class="grid h-full w-full grid-cols-8 grid-rows-8">
			{#each rows as row}
				{#each cols as col}
					{@const isDark = (row + col) % 2 === 1}
					{@const square = getSquare(row, col)}
					{@const piece = board[row][col]}

					{@const isBeingDragged = draggedPiece?.row === row && draggedPiece?.col === col}
					{@const isPossibleMove = possibleMoves.includes(square)}
					{@const isCaptureMove = isPossibleMove && piece !== null}
					{@const isKingInDanger = square === kingSquare}

					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<div
						class="relative flex items-center justify-center transition-all duration-200
						{isDark ? 'bg-[#769656] text-[#eeeed2]' : 'bg-[#eeeed2] text-[#769656]'}
                        {isKingInDanger ? 'ring-inset ring-4 ring-red-500 bg-red-400/50' : ''}
						"
						data-square={square}
						on:mousedown={(e) => handleMouseDown(e, row, col, piece)}
					>
						<!-- Coordinate labels -->
						{#if col === (orientation === 'white' ? 0 : 7)}
							<span class="absolute top-0.5 left-1 text-[0.65rem] font-bold opacity-80">
								{8 - row}
							</span>
						{/if}
						{#if row === (orientation === 'white' ? 7 : 0)}
							<span class="absolute bottom-0 right-1 text-[0.65rem] font-bold opacity-80">
								{String.fromCharCode(97 + col)}
							</span>
						{/if}

						<!-- Piece -->
						{#if piece && !isBeingDragged}
							{@const Component = pieceComponents[piece.type]}
							<div
								class="h-[80%] w-[80%] cursor-grab active:cursor-grabbing {isCaptureMove
									? 'opacity-80'
									: ''} z-10"
							>
								<svelte:component
									this={Component}
									size="100%"
									strokeWidth={1.5}
									class="drop-shadow-lg filter {getPieceColorClasses(piece.color)}"
								/>
							</div>
						{/if}

						<!-- Possible Move Indicators -->
						{#if isPossibleMove}
							{#if isCaptureMove}
								<!-- Corner indicators for capture -->
								<div class="absolute inset-0 z-0">
									<div
										class="absolute top-0 left-0 w-3 h-3 border-t-4 border-l-4 border-black/20 rounded-tl-sm"
									></div>
									<div
										class="absolute top-0 right-0 w-3 h-3 border-t-4 border-r-4 border-black/20 rounded-tr-sm"
									></div>
									<div
										class="absolute bottom-0 left-0 w-3 h-3 border-b-4 border-l-4 border-black/20 rounded-bl-sm"
									></div>
									<div
										class="absolute bottom-0 right-0 w-3 h-3 border-b-4 border-r-4 border-black/20 rounded-br-sm"
									></div>
								</div>
							{:else}
								<!-- Soft Dot -->
								<div
									class="absolute h-3.5 w-3.5 rounded-full bg-black/15 pointer-events-none"
								></div>
							{/if}
						{/if}
					</div>
				{/each}
			{/each}
		</div>

		<!-- Checkmate Overlay -->
		{#if isCheckmate && winner}
			<div
				class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-500"
			>
				<div
					class="flex flex-col items-center gap-2 p-6 rounded-xl bg-neutral-900 border border-neutral-700 shadow-2xl text-center"
				>
					<Trophy class="w-16 h-16 text-yellow-500 mb-2" strokeWidth={1.5} />
					<h2 class="text-3xl font-black text-white tracking-tight">Checkmate!</h2>
					<p class="text-lg font-medium text-neutral-300">
						<span class={winner === 'White' ? 'text-white' : 'text-neutral-400'}>{winner}</span> wins
					</p>
				</div>
			</div>
		{/if}

		<!-- Dragged Piece Floating Layer -->
		{#if draggedPiece}
			{@const Component = pieceComponents[draggedPiece.type]}
			<div
				class="fixed z-50 pointer-events-none h-16 w-16"
				style="left: {draggedPiece.x}px; top: {draggedPiece.y}px; transform: translate(-50%, -50%);"
			>
				<svelte:component
					this={Component}
					size="100%"
					strokeWidth={1.5}
					class="drop-shadow-xl filter {getPieceColorClasses(draggedPiece.color)}"
				/>
			</div>
		{/if}
	</div>

	<!-- Captured Pieces (Bottom - Me) -->
	<div class="flex h-8 w-full items-center gap-1 rounded bg-neutral-900/50 px-2 min-h-[32px]">
		{#each orientation === 'white' ? capturedPieces.b : capturedPieces.w as piece}
			{@const Component = pieceComponents[piece]}
			<div class="relative h-6 w-6">
				<svelte:component
					this={Component}
					size="100%"
					class="drop-shadow-sm filter {getPieceColorClasses(orientation === 'white' ? 'b' : 'w')}"
					strokeWidth={1.5}
				/>
			</div>
		{/each}
	</div>
</div>
