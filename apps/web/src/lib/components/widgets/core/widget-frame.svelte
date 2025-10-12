<script lang="ts">
import { type Snippet } from "svelte";

let { children }: { children?: Snippet } = $props();
</script>

<div class="border p-8 lg:p-16 rounded h-full">
    {@render children?.()}
</div>
