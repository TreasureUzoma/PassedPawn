<script lang="ts">
	import { createQuery, createQueries } from '@tanstack/svelte-query';
	import api from '$lib/utils/axios-client';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	interface PlayerProfile {
		avatar?: string;
		username: string;
		name?: string;
		followers: number;
		country?: string;
	}

	interface ArchiveResponse {
		archives: string[];
	}

	interface GamePlayer {
		username: string;
		rating: number;
		result: string;
	}

	interface Game {
		pgn: string;
		time_control: string;
		white: GamePlayer;
		black: GamePlayer;
		time_class: string;
		rules: string;
		end_time?: number;
		last_activity?: number;
		url: string;
	}

	interface GameResponse {
		games: Game[];
	}

	// 1. Fetch Profile
	const profileQuery = createQuery(() => ({
		queryKey: ['player', data.username],
		queryFn: async () => {
			const res = await api.get<PlayerProfile>(`https://api.chess.com/pub/player/${data.username}`);
			// @ts-ignore - The interceptor returns data directly
			return res as PlayerProfile;
		}
	}));

	// 2. Fetch Archives
	const archivesQuery = createQuery(() => ({
		queryKey: ['archives', data.username],
		queryFn: async () => {
			const res = await api.get<ArchiveResponse>(
				`https://api.chess.com/pub/player/${data.username}/games/archives`
			);
			// @ts-ignore - The interceptor returns data directly
			return res as ArchiveResponse;
		}
	}));

	// 3. Derive Last 3 Months
	const last3Archives = $derived(
		archivesQuery.data?.archives ? archivesQuery.data.archives.slice(-3).reverse() : []
	);

	// 4. Fetch Games for those months
	const gamesQueries = createQueries(() => ({
		queries: last3Archives.map((url: string) => ({
			queryKey: ['games', url],
			queryFn: async () => {
				const res = await api.get<GameResponse>(url);
				// @ts-ignore - The interceptor returns data directly
				return res as GameResponse;
			}
		}))
	}));

	// Combine games from all queries
	const allGames = $derived(
		gamesQueries.flatMap((q) => (q.data?.games ? q.data.games.reverse() : []))
	);

	function getResult(game: Game) {
		const whiteRes = game.white.result;
		const blackRes = game.black.result;

		if (whiteRes === 'win') return 'White Won';
		if (blackRes === 'win') return 'Black Won';
		if (whiteRes === 'agreed' || blackRes === 'agreed') return 'Draw';
		if (whiteRes === 'repetition' || blackRes === 'repetition') return 'Draw';
		if (whiteRes === 'stalemate' || blackRes === 'stalemate') return 'Draw';
		if (whiteRes === 'lucena' || blackRes === 'lucena') return 'Adjudicated'; // rare
		return 'Draw'; // Default fallback
	}

	function getGameDate(game: Game) {
		const timestamp = game.end_time || game.last_activity;
		if (!timestamp) return 'Unknown Date';
		return new Date(timestamp * 1000).toLocaleDateString();
	}
</script>

<div class="container mx-auto max-w-4xl space-y-8 p-4">
	<!-- Profile Header -->
	{#if profileQuery.isPending}
		<div class="flex animate-pulse items-center gap-4">
			<div class="h-20 w-20 rounded bg-muted"></div>
			<div class="space-y-2">
				<div class="h-6 w-40 rounded bg-muted"></div>
				<div class="h-4 w-20 rounded bg-muted"></div>
			</div>
		</div>
	{:else if profileQuery.data}
		<div class="flex items-center gap-6 rounded-lg border bg-card p-6 shadow-sm">
			<img
				src={profileQuery.data.avatar ?? `https://avatar.idolo.dev/${data.username}`}
				alt={profileQuery.data.username}
				class="h-20 w-20 rounded object-cover shadow-md"
			/>
			<div>
				<h1 class="text-3xl font-bold tracking-tight">{profileQuery.data.username}</h1>
				<div class="mt-1 flex gap-2 text-muted-foreground">
					<span
						>{profileQuery.data.name || profileQuery.data.username} • {profileQuery.data.followers} followers</span
					>
					{#if profileQuery.data.country}
						<a
							href={profileQuery.data.country}
							target="_blank"
							class="text-primary hover:underline"
						>
							Country
						</a>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- Games List -->
	<div class="space-y-4">
		<h2 class="text-2xl font-semibold">Recent Games ({allGames.length})</h2>

		{#if archivesQuery.isPending || (last3Archives.length > 0 && gamesQueries[0]?.isPending)}
			<div class="space-y-4">
				{#each Array(3) as _}
					<div class="h-24 animate-pulse rounded-lg border bg-card"></div>
				{/each}
			</div>
		{:else}
			<div class="grid gap-3">
				{#each allGames as game}
					<a
						href="/games/pgn?pgn={encodeURIComponent(game.pgn)}"
						class="group block rounded-lg border bg-card p-4 transition-all hover:border-primary hover:shadow-md"
					>
						<div class="flex items-center justify-between">
							<div class="flex flex-col gap-1">
								<span class="font-medium">
									{game.white.username} ({game.white.rating}) vs {game.black.username} ({game.black
										.rating})
								</span>
								<span class="text-sm capitalize text-muted-foreground">
									{game.time_class} • {game.rules} • {getGameDate(game)}
								</span>
							</div>
							<div class="rounded bg-secondary px-3 py-1 text-sm font-medium">
								{getResult(game)}
							</div>
						</div>
					</a>
				{/each}
				{#if allGames.length === 0}
					<p class="py-8 text-center text-muted-foreground">No recent games found.</p>
				{/if}
			</div>
		{/if}
	</div>
</div>
