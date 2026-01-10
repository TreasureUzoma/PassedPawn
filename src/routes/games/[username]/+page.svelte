<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import type { PageData } from './$types';
	import {
		Timer,
		Zap,
		Calendar,
		Trophy,
		Users,
		ChevronRight,
		PlusCircle,
		MinusCircle,
		CircleSlash,
		Clock
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	// ... previous interfaces ...
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

	function getGameResult(game: Game) {
		const isWhite = game.white.username.toLowerCase() === data.username.toLowerCase();
		const player = isWhite ? game.white : game.black;
		const opponent = isWhite ? game.black : game.white;

		if (player.result === 'win')
			return { type: 'win', label: 'Win', color: 'text-green-500', icon: PlusCircle };
		if (opponent.result === 'win')
			return { type: 'loss', label: 'Loss', color: 'text-red-500', icon: MinusCircle };

		return { type: 'draw', label: 'Draw', color: 'text-muted-foreground', icon: CircleSlash };
	}

	function getGameTypeIcon(timeClass: string) {
		switch (timeClass) {
			case 'blitz':
				return Zap;
			case 'bullet':
				return Zap; // Wait, I'll use Zap for both
			case 'rapid':
				return Timer;
			case 'daily':
				return Calendar;
			default:
				return Clock;
		}
	}

	function getGameDate(game: Game) {
		const ts = game.end_time || game.last_activity;
		if (!ts) return 'Unknown';
		return new Date(ts * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
	}
</script>

<div class="container mx-auto max-w-4xl space-y-6 p-4">
	{#if profileQuery.isPending}
		<div class="flex animate-pulse items-center gap-4 p-6 border rounded-xl bg-card">
			<div class="h-20 w-20 rounded-full bg-muted"></div>
			<div class="space-y-2">
				<div class="h-6 w-40 rounded bg-muted"></div>
				<div class="h-4 w-20 rounded bg-muted"></div>
			</div>
		</div>
	{:else if profileQuery.data}
		<div
			class="flex flex-col sm:flex-row items-center sm:items-start gap-6 rounded-2xl border bg-card p-6 shadow-sm relative overflow-hidden"
		>
			<!-- Decoration -->
			<div class="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>

			<img
				src={profileQuery.data.avatar ?? `https://avatar.idolo.dev/${data.username}`}
				alt={profileQuery.data.username}
				class="h-24 w-24 rounded-full border-4 border-background shadow-xl object-cover"
			/>
			<div class="text-center sm:text-left">
				<h1 class="text-4xl font-black tracking-tight">{profileQuery.data.username}</h1>
				<div
					class="mt-2 flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-muted-foreground"
				>
					<span class="flex items-center gap-1.5 font-medium">
						<Users class="h-4 w-4" />
						{profileQuery.data.followers.toLocaleString()} followers
					</span>
					{#if profileQuery.data.country}
						<span class="flex items-center gap-1.5 font-medium">
							<span class="opacity-50">#</span>
							{profileQuery.data.country.split('/').pop()}
						</span>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<div class="space-y-4">
		<div class="flex items-center justify-between px-2">
			<h2 class="text-xl font-bold flex items-center gap-2">
				<Trophy class="h-5 w-5 text-yellow-500" />
				Recent Games
			</h2>
			<div class="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded border">
				{allGamesQuery.data?.length || 0} GAMES
			</div>
		</div>

		{#if archivesQuery.isPending || allGamesQuery.isPending}
			<div class="space-y-3">
				{#each Array(5) as _}
					<div class="h-20 animate-pulse rounded-xl border bg-card"></div>
				{/each}
			</div>
		{:else if archivesQuery.isError || allGamesQuery.isError}
			<div
				class="py-8 text-center text-destructive bg-destructive/10 rounded-xl border border-destructive/20 p-4"
			>
				<p class="font-bold">Failed to load games</p>
				<p class="text-xs opacity-80">Chess.com API might be temporarily unavailable</p>
			</div>
		{:else}
			<div class="grid gap-3">
				{#each (allGamesQuery.data ?? [])
					.sort((a, b) => {
						const timeA = a.end_time || a.last_activity || 0;
						const timeB = b.end_time || b.last_activity || 0;
						return timeB - timeA;
					})
					.slice(0, 50) as game}
					{@const result = getGameResult(game)}
					{@const TypeIcon = getGameTypeIcon(game.time_class)}
					<a
						href="/games/pgn?pgn={encodeURIComponent(game.pgn)}"
						class="group relative flex items-center gap-3 sm:gap-4 rounded-xl border bg-card p-3 sm:p-4 transition-all hover:border-primary hover:shadow-lg active:scale-[0.98]"
					>
						<!-- Left: Game Type Icon -->
						<div
							class="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors"
						>
							<TypeIcon class="h-5 w-5 sm:h-6 sm:w-6" />
						</div>

						<!-- Center: Players -->
						<div class="flex-1 min-w-0">
							<div class="flex flex-col gap-0.5">
								<div class="flex items-center gap-1.5 text-sm sm:text-base font-bold min-w-0">
									<span class="truncate">{game.white.username}</span>
									<span class="text-[10px] opacity-40 font-mono shrink-0">VS</span>
									<span class="truncate">{game.black.username}</span>
								</div>
								<div
									class="mt-0.5 flex items-center flex-wrap gap-x-2 gap-y-1 text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wider"
								>
									<span>{game.time_class}</span>
									<span class="opacity-30">•</span>
									<span>{game.rules}</span>
									<span class="opacity-30">•</span>
									<span>{getGameDate(game)}</span>
								</div>
							</div>
						</div>

						<!-- Right: Result Icon -->
						<div class="flex shrink-0 items-center gap-3">
							<div class="flex flex-col items-end">
								<result.icon class="h-5 w-5 sm:h-6 sm:w-6 {result.color}" />
								<span
									class="hidden sm:block text-[10px] font-bold {result.color} mt-1 uppercase tracking-tighter"
								>
									{result.label}
								</span>
							</div>
							<ChevronRight
								class="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors"
							/>
						</div>
					</a>
				{/each}

				{#if allGamesQuery.data?.length === 0}
					<div
						class="py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed"
					>
						<p class="font-medium italic">No recent games found for this user.</p>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
