<script lang="ts">
import { LocateFixed, RotateCw } from "@lucide/svelte";
import { toast } from "svelte-sonner";
import { Button } from "#lib/components/ui/button/index.ts";
import { SCREENS } from "#lib/constants.ts";
import { getPlacement, loadImage, transformImage } from "#lib/utils/transform-image.ts";

let {
	source,
	target,
	onChange,
	dragging = $bindable(false),
}: { source: string; target: HTMLElement | undefined; onChange: (image: string) => void; dragging?: boolean } = $props();

const SCREEN = SCREENS["7.3_WAVESHARE_COLORS_E"].resolution;
const MAX_ZOOM = 3;

let img = $state<HTMLImageElement>();
let zoom = $state(1);
let x = $state(0);
let y = $state(0);
let rotation = $state(0);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

$effect(() => {
	loadImage(source)
		.then((loaded) => (img = loaded))
		.catch(() => toast.error("Fail to process the image"));
});

$effect(() => {
	if (img) onChange(transformImage(img, SCREEN, { zoom, x, y, rotation }));
});

function pan(image: HTMLImageElement, element: HTMLElement, dx: number, dy: number) {
	const { overflowX, overflowY } = getPlacement({ width: image.naturalWidth, height: image.naturalHeight }, SCREEN, { zoom, x, y, rotation });
	const pxRatio = SCREEN.width / (element.querySelector("img")?.clientWidth || element.clientWidth);
	if (overflowX > 0) x = clamp(x - (2 * dx * pxRatio) / overflowX, -1, 1);
	if (overflowY > 0) y = clamp(y - (2 * dy * pxRatio) / overflowY, -1, 1);
}

$effect(() => {
	const element = target;
	const image = img;
	if (!element || !image) return;

	const pointers = new Map<number, { x: number; y: number }>();
	let wheelTimeout: ReturnType<typeof setTimeout>;

	const down = (e: PointerEvent) => {
		element.setPointerCapture(e.pointerId);
		pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
		dragging = true;
	};
	const move = (e: PointerEvent) => {
		const last = pointers.get(e.pointerId);
		if (!last) return;
		const current = { x: e.clientX, y: e.clientY };
		const other = [...pointers].find(([id]) => id !== e.pointerId)?.[1];
		if (other) zoom = clamp((zoom * distance(other, current)) / distance(other, last), 1, MAX_ZOOM);
		else pan(image, element, current.x - last.x, current.y - last.y);
		pointers.set(e.pointerId, current);
	};
	const up = (e: PointerEvent) => {
		pointers.delete(e.pointerId);
		dragging = pointers.size > 0;
	};
	const wheel = (e: WheelEvent) => {
		e.preventDefault();
		zoom = clamp(zoom * Math.exp(-e.deltaY * 0.001), 1, MAX_ZOOM);
		dragging = true;
		clearTimeout(wheelTimeout);
		wheelTimeout = setTimeout(() => (dragging = false), 300);
	};
	const noNativeDrag = (e: DragEvent) => e.preventDefault();

	element.style.cursor = "grab";
	element.style.touchAction = "none";
	element.addEventListener("pointerdown", down);
	element.addEventListener("pointermove", move);
	element.addEventListener("pointerup", up);
	element.addEventListener("pointercancel", up);
	element.addEventListener("wheel", wheel, { passive: false });
	element.addEventListener("dragstart", noNativeDrag);

	return () => {
		clearTimeout(wheelTimeout);
		element.style.cursor = "";
		element.style.touchAction = "";
		element.removeEventListener("pointerdown", down);
		element.removeEventListener("pointermove", move);
		element.removeEventListener("pointerup", up);
		element.removeEventListener("pointercancel", up);
		element.removeEventListener("wheel", wheel);
		element.removeEventListener("dragstart", noNativeDrag);
	};
});
</script>

<div class="flex flex-col gap-2">
    <p class="text-sm text-muted-foreground">Drag the preview to move, scroll or pinch to zoom.</p>
    <div class="flex gap-2">
        <Button variant="secondary" class="flex-1" onclick={() => (rotation = (rotation + 90) % 360)}>
            <RotateCw />
            Rotate
        </Button>
        <Button variant="secondary" class="flex-1" onclick={() => ((x = 0), (y = 0))}>
            <LocateFixed />
            Center
        </Button>
    </div>
</div>
