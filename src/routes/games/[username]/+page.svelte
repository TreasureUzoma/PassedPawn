<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	interface PlayerProfile {
		avatar?: string;
		username: string;
		name?: string;
		followers: number;
		country?: string;
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

	interface ArchiveResponse {
		archives: string[];
	}

	async function fetchRecentGames(username: string): Promise<Game[]> {
		const archiveRes = await fetch(`https://api.chess.com/pub/player/${username}/games/archives`);
		if (!archiveRes.ok) throw new Error('Failed to fetch archives');
		const archiveData: ArchiveResponse = await archiveRes.json();

		const last3Archives = archiveData.archives.slice(-3);

		const gamePromises = last3Archives.map(async (url) => {
			const gameRes = await fetch(url);
			if (!gameRes.ok) throw new Error(`Failed to fetch games from: ${url}`);
			const gameData = await gameRes.json();
			return gameData.games || [];
		});

		const gamesArrays = await Promise.all(gamePromises);

		return gamesArrays.flat().reverse();
	}

	const profileQuery = createQuery(() => ({
		queryKey: ['player', data.username],
		queryFn: async () => {
			const res = await fetch(`https://api.chess.com/pub/player/${data.username}`);
			if (!res.ok) throw new Error('Failed to fetch profile');
			return res.json() as Promise<PlayerProfile>;
		}
	}));

	const combinedGamesQuery = createQuery(() => ({
		queryKey: ['recentGames', data.username],
		queryFn: () => fetchRecentGames(data.username)
	}));

	const allGames = $derived(combinedGamesQuery.data || []);

	function getResult(game: Game) {
		const whiteRes = game.white.result;
		const blackRes = game.black.result;

		if (whiteRes === 'win') return 'White Won';
		if (blackRes === 'win') return 'Black Won';
		if (whiteRes === 'agreed' || blackRes === 'agreed') return 'Draw';
		if (whiteRes === 'repetition' || blackRes === 'repetition') return 'Draw';
		if (whiteRes === 'stalemate' || blackRes === 'stalemate') return 'Draw';
		if (whiteRes === 'lucena' || blackRes === 'lucena') return 'Adjudicated';
		return 'Draw';
	}

	function getGameDate(game: Game) {
		const timestamp = game.end_time || game.last_activity;
		if (!timestamp) return 'Unknown Date';
		return new Date(timestamp * 1000).toLocaleDateString();
	}
</script>

<div class="container mx-auto max-w-4xl space-y-8 p-4">
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

	<div class="space-y-4">
		<h2 class="text-2xl font-semibold">Recent Games ({allGames.length})</h2>

		{#if combinedGamesQuery.isPending}
			<div class="space-y-4">
				{#each Array(3) as _}
					<div class="h-24 animate-pulse rounded-lg border bg-card"></div>
				{/each}
			</div>
		{:else if combinedGamesQuery.isError}
			<p class="py-8 text-center text-destructive-foreground bg-destructive rounded-lg p-4">
				Error loading games. Please check the console for details.
			</p>
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
