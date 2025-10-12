<script lang="ts">
import { applyDitheringBrowser } from "@framik/shared/browser";
import { base64Img } from "./img";

let ditheredImg = $state<string | undefined>(undefined);
let slider = $state(80); // percentage of reveal

$effect(() => {
	applyDitheringBrowser(base64Img).then((res) => {
		ditheredImg = res;
	});
});
</script>

<div class="h-screen w-screen flex flex-col gap-8 items-center justify-center">
    <div class="relative">
        <img src={base64Img} alt="Original" class="h-full block" />

        <div
            class="absolute top-0 bottom-0 left-0 h-full overflow-hidden bg-no-repeat"
            style={`width: ${slider}%; background-image: url(${ditheredImg})`}
        >
        </div>
    </div>

  <input
    type="range"
    min="0"
    max="100"
    bind:value={slider}
    class=""
  />
</div>
