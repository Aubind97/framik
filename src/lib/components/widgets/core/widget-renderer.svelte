<script lang="ts">
const { image }: { image: string | undefined } = $props();
</script>

<div class="bg-muted rounded overflow-hidden flex items-center justify-center">
    {#if image === undefined}
        <div class="p-2">
            <span
                class="block animate-spin w-8 h-8 border-4 rounded-full border-l-transparent"
            ></span>
        </div>
    {:else}
        <img
            alt="widget renderer"
            src={`data:image/png;base64,${image}`}
            style="image-rendering: pixelated;"
        />{/if}
</div>
