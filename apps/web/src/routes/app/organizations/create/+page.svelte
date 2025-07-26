<script lang="ts">
import { toast } from "svelte-sonner";
import { createOrganization, selectActiveOrganization, useActiveOrganization } from "$lib/auth-client";
import OrganizationCreationForm from "$lib/components/forms/organization-creation.form.svelte";
import type { OrganizationCreationFormValue } from "$lib/components/forms/utils/schemas";
    import { goto } from "$app/navigation";

async function handleSubmit(formValue: OrganizationCreationFormValue) {
	const { data, error } = await createOrganization({
		name: formValue.name.trim(),
		slug: formValue.name.replaceAll(" ", "_").toLowerCase().trim(),
		keepCurrentActiveOrganization: true,
	});

	if (error?.code) {
		toast.error(error.code);
		return;
	}

	toast.success("Organization created", {
		action: {
			label: "Switch to this organization",
			onClick: async () => {
				await selectActiveOrganization({ organizationId: data?.id });
				goto('/app')
			},
		},
	});
}
</script>

<div class="max-w-prose w-full mx-auto">
    <OrganizationCreationForm {handleSubmit} />
</div>
