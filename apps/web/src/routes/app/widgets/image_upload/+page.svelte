<script lang="ts">
import { Frame } from "@lucide/svelte";
import { mode } from "mode-watcher";
import FrameControls from "$lib/components/utils/frame-controls.svelte";
import UploadImageWidget from "$lib/components/widgets/upload-image/widget.svelte";
import { WIDGETS } from "$lib/constants";

let loadedImage = $state<string | undefined>(undefined);

const WIDGET = WIDGETS.image_upload;

async function handleImageLoad(image: string) {
	loadedImage = image;
}
</script>

<div class="h-full flex flex-col gap-4">
    <div class="flex flex-col lg:flex-row gap-4 justify-between items-center">
        <div class="flex items-center gap-4">
            <Frame size={32} />
            <div>
                <h1 class="text-xl font-bold">{WIDGET.name}</h1>
                <p class="text-muted-foreground">{WIDGET.description}</p>
            </div>
        </div>

        <FrameControls {loadedImage}/>
    </div>
    <div class="flex-1 flex items-start lg:items-center justify-center">
        <UploadImageWidget {handleImageLoad} />
    </div>
</div>
