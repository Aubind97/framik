<script lang="ts">
import FrameControls from "$lib/components/utils/frame-controls.svelte";
import UnsplashImageWidget from "$lib/components/widgets/unsplash-image/widget.svelte";
import { WIDGETS } from "$lib/constants";

let loadedImage = $state<string | undefined>(undefined);

const WIDGET = WIDGETS.unsplash;

async function handleImageLoad(image: string) {
	loadedImage = image;
}
</script>

<div class="h-full flex flex-col gap-4">
    <div class="flex justify-between items-center">
        <div class="flex items-center gap-4">
            <img alt="{WIDGET.name} Logo" src={WIDGET.logo} class="size-8"/>
            <div>
                <h1 class="text-xl font-bold">{WIDGET.name}</h1>
                <p class="text-muted-foreground">{WIDGET.description}</p>
            </div>
        </div>

        <FrameControls {loadedImage}/>
    </div>
    <div class="flex-1 flex items-start lg:items-center justify-center">
        <UnsplashImageWidget {handleImageLoad} />
    </div>
</div>
