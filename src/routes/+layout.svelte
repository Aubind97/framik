<script lang="ts">
import "../app.css";

// biome-ignore lint/correctness/noUnusedVariables : used as a renderer
const { children } = $props();
</script>

{@render children()}
