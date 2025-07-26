<script lang="ts">
import { toast } from "svelte-sonner";
import { goto } from "$app/navigation";
import { page } from "$app/stores";
import { signIn } from "$lib/auth-client";
import SignInForm from "$lib/components/forms/sign-in.form.svelte";
import type { SignInFormValue } from "$lib/components/forms/utils/schemas";

async function handleSubmit(formValue: SignInFormValue) {
	const { error } = await signIn.email({
		email: formValue.email,
		password: formValue.password,
	});

	if (error?.code) {
		toast.error(error.code);
		return;
	}

	// Get redirect URL from query parameters, default to /app
	const redirectTo = $page.url.searchParams.get("redirect") || "/app";
	goto(redirectTo);
}
</script>

<div class="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
  <div class="w-full max-w-sm">
    <SignInForm {handleSubmit} />
  </div>
</div>
