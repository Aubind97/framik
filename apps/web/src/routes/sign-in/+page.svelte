<script lang="ts">
import { goto } from "$app/navigation";
import { signIn } from "$lib/auth-client";
import SignInForm from "$lib/components/forms/sign-in.form.svelte";
import type { SignInFormValue } from "$lib/components/forms/utils/schemas";

async function handleSubmit(formValue: SignInFormValue) {
	await signIn.email({
		email: formValue.email,
		password: formValue.password,
	});

	goto("/app");
}
</script>

<div class="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
  <div class="w-full max-w-sm">
    <SignInForm {handleSubmit} />
  </div>
</div>
