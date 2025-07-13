<script>
import ImageWidget from "$lib/components/widgets/image/widget.svelte";
import UnsplashImageWidget from "$lib/components/widgets/unsplash-image/widget.svelte";
</script>

<div class="grid grid-flow-col grid-rows-[repeat(3, 400px)] gap-2 p-2">
    <UnsplashImageWidget />
    <ImageWidget />
</div>
