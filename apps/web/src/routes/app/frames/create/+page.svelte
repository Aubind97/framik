<script lang="ts">
import { createMutation } from "@tanstack/svelte-query";
import { toast } from "svelte-sonner";
import { goto } from "$app/navigation";
import { createFrame } from "$lib/api/fetch/frame";
import { useActiveOrganization } from "$lib/auth-client";
import FrameCreation from "$lib/components/forms/frame-creation.form.svelte";
import type { FrameCreationFormValue } from "$lib/components/forms/utils/schemas";

let activeOrganization = useActiveOrganization();

async function handleSubmit(formValue: FrameCreationFormValue) {
	const organizationId = $activeOrganization.data?.id;

	if (organizationId) {
		const { error } = await createFrame({ apiUrl: formValue.apiUrl, name: formValue.name, organizationId: $activeOrganization.data?.id });

		if (error?.name) {
			toast.error(error.name);
			return;
		}

		toast.success("Frame created");
		goto("/app/frames");
	}
}
</script>

<div class="max-w-prose w-full mx-auto">
    <FrameCreation {handleSubmit} />
</div>
