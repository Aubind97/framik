<script lang="ts">
import { toast } from "svelte-sonner";
import { goto } from "$app/navigation";
import FrameCreation from "$lib/components/forms/frame-creation.form.svelte";
import type { FrameCreationFormValue } from "$lib/components/forms/utils/schemas";

async function handleSubmit(formValue: FrameCreationFormValue) {
	// const { data, error } = await createOrganization({
	// 	name: formValue.name.trim(),
	// 	slug: formValue.name.replaceAll(" ", "_").toLowerCase().trim(),
	// 	keepCurrentActiveOrganization: true,
	// });

	// if (error?.code) {
	// 	toast.error(error.code);
	// 	return;
	// }
	console.log(formValue);

	toast.success("Frame created");
	goto("/app/frames");
}
</script>

<div class="max-w-prose w-full mx-auto">
    <FrameCreation {handleSubmit} />
</div>
