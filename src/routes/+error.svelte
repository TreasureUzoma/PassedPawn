<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	const status = page.status;
	const error = page.error;

	function goHome() {
		goto('/');
	}
</script>

<svelte:head>
	<title>
		{status === 404 ? '404 - Page Not Found' : `${status} - Error`}
	</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="min-h-screen flex-center text-center flex-col space-y-2">
	<p>{status}</p>
	<p class="mt-2 text-muted-foreground">{error?.message}</p>
</main>
