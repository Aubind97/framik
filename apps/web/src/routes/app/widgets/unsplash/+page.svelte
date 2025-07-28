<script lang="ts">
import FrameControls from "$lib/components/utils/frame-controls.svelte";
import UnsplashImageWidget from "$lib/components/widgets/unsplash-image/widget.svelte";

let loadedImage = $state<string | undefined>(undefined);

async function handleImageLoad(image: string) {
	loadedImage = image;
}
</script>

<div class="h-full flex flex-col gap-4">
    <FrameControls {loadedImage}/>
    <div class="flex-1 flex items-start lg:items-center justify-center">
        <UnsplashImageWidget {handleImageLoad} />
    </div>
</div>
