<script lang="ts">
import { toast } from "svelte-sonner";
import { goto } from "$app/navigation";
import { signUp } from "$lib/auth-client";
import SignUpForm from "$lib/components/forms/sign-up.form.svelte";
import type { SignUpFormValue } from "$lib/components/forms/utils/schemas";

async function handleSubmit(formValue: SignUpFormValue) {
	const { error } = await signUp.email({
		name: formValue.name.trim(),
		email: formValue.email,
		password: formValue.password,
	});

	if (error?.code) {
		toast.error(error.code);
		return;
	}

	goto("/app");
}
</script>

<div class="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
  <div class="w-full max-w-sm">
    <SignUpForm {handleSubmit} />
  </div>
</div>
