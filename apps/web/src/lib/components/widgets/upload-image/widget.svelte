<script lang="ts">
import { LayoutGrid } from "@lucide/svelte";
import { Jimp } from "jimp";
import { toast } from "svelte-sonner";
import { Input } from "$lib/components/ui/input";
import Label from "$lib/components/ui/label/label.svelte";
import { Toggle } from "$lib/components/ui/toggle";
import Widget from "$lib/components/widgets/core/widget.svelte";
import { SCREENS } from "$lib/constants";

const { handleImageLoad }: { handleImageLoad?: (image: string) => void } = $props();

let image = $state<string | undefined>(undefined);
let showProcessedPreview = $state(true);

async function loadImage(event: Event) {
	const target = event.target as HTMLInputElement;
	const file = target.files?.[0];
	if (!file) return;

	try {
		const arrayBuffer = await file.arrayBuffer();
		const jimpImage = await Jimp.read(arrayBuffer);

		const croppedImage = jimpImage.cover({ h: SCREENS["7.3_WAVESHARE_COLORS_E"].resolution.height, w: SCREENS["7.3_WAVESHARE_COLORS_E"].resolution.width });
		const base64image = await croppedImage.getBase64("image/jpeg");
		image = base64image;
		handleImageLoad?.(image);
	} catch (error) {
		toast.error("Fail to process the image");
	}
}
</script>

<div class="w-full grid lg:grid-cols-[1fr_auto] gap-4">
    <Widget {image} {showProcessedPreview} />

    <aside class="p-4 border rounded min-w-64 flex flex-col gap-4">
        <h1 class="font-bold">Settings</h1>
        <div class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
                <Label>Load image</Label>
                <Input type="file" onchange={loadImage} accept="image/png, image/jpeg"/>
            </div>

            <Label>
                <Toggle variant="outline" aria-label="Toggle pixelated preview" bind:pressed={showProcessedPreview}>
                    <LayoutGrid class="size-4" />
                </Toggle>
                Show processed preview
            </Label>
        </div>
    </aside>
</div>
