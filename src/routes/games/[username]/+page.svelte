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

	const profileQuery = createQuery(() => ({
		queryKey: ['player', data.username],
		queryFn: async () => {
			const res = await fetch(`https://api.chess.com/pub/player/${data.username}`);
			if (!res.ok) throw new Error('Failed to fetch profile');
			return res.json() as Promise<PlayerProfile>;
		}
	}));

	const archivesQuery = createQuery(() => ({
		queryKey: ['archives', data.username],
		queryFn: async () => {
			const res = await fetch(`https://api.chess.com/pub/player/${data.username}/games/archives`);
			if (!res.ok) throw new Error('Failed to fetch archives index');
			const archiveData: ArchiveResponse = await res.json();
			return archiveData.archives.reverse();
		}
	}));

	const allGamesQuery = createQuery(() => ({
		queryKey: ['allGames', data.username],
		enabled: !!archivesQuery.data,
		queryFn: async () => {
			const urls = archivesQuery.data!;
			const results = await Promise.all(
				urls.map(async (url) => {
					const res = await fetch(url);
					if (!res.ok) return [];
					const json = await res.json();
					return json.games || [];
				})
			);
			return results.flat() as Game[];
		}
	}));

	function getResult(game: Game) {
		const w = game.white.result;
		const b = game.black.result;

		if (w === 'win') return `${game.white.username} (White) Won`;
		if (b === 'win') return `${game.black.username} (Black) Won`;
		if (w === 'agreed' || b === 'agreed') return 'Draw';
		if (w === 'repetition' || b === 'repetition') return 'Draw';
		if (w === 'stalemate' || b === 'stalemate') return 'Draw';
		if (w === 'lucena' || b === 'lucena') return 'Adjudicated';

		return 'Draw';
	}

	function getGameDate(game: Game) {
		const ts = game.end_time || game.last_activity;
		if (!ts) return 'Unknown Date';
		return new Date(ts * 1000).toLocaleDateString();
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
				<h1 class="text-3xl font-bold">{profileQuery.data.username}</h1>
				<div class="mt-1 flex gap-2 text-muted-foreground">
					<span
						>{profileQuery.data.name || profileQuery.data.username} • {profileQuery.data.followers} followers</span
					>
					{#if profileQuery.data.country}
						<a href={profileQuery.data.country} target="_blank" class="text-primary hover:underline"
							>{profileQuery.data.country.slice(-2)}</a
						>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<div class="space-y-4">
		<h2 class="text-2xl font-semibold">
			Recent Games ({allGamesQuery.data?.length || 0} / {(archivesQuery.data?.length ?? 0) * 50 ||
				'...'})
		</h2>

		{#if archivesQuery.isPending || allGamesQuery.isPending}
			<div class="space-y-4">
				{#each Array(6) as _}
					<div class="h-24 animate-pulse rounded-lg border bg-card"></div>
				{/each}
			</div>
		{:else if archivesQuery.isError || allGamesQuery.isError}
			<p class="py-8 text-center text-destructive-foreground bg-destructive rounded-lg p-4">
				Error loading archives or games.
			</p>
		{:else}
			<div class="grid gap-3">
				{#each allGamesQuery.data as game}
					<a
						href="/games/pgn?pgn={encodeURIComponent(game.pgn)}"
						class="group block rounded-lg border bg-card p-4 transition-all hover:border-primary hover:shadow-md"
					>
						<div class="flex items-center justify-between">
							<div class="flex flex-col gap-1">
								<span class="font-medium">
									{game.white.username} ({game.white.rating}) vs
									{game.black.username} ({game.black.rating})
								</span>
								<span class="text-sm text-muted-foreground capitalize">
									{game.time_class} • {game.rules} • {getGameDate(game)}
								</span>
							</div>
							<div class="rounded bg-secondary px-3 py-1 text-sm font-medium">
								{getResult(game)}
							</div>
						</div>
					</a>
				{/each}

				{#if allGamesQuery.data?.length === 0}
					<p class="py-8 text-center text-muted-foreground">No recent games found.</p>
				{/if}
			</div>
		{/if}
	</div>
</div>
