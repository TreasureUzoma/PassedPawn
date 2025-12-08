<script>
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/button/button.svelte';
</script>

<div class="min-h-screen flex-center p-4">
	<h3>Coming soon!!!</h3>
	<Button onclick={() => goto('/')}>Go Back</Button>
</div>
