<script lang="ts">
import { signUp } from "$lib/auth-client";
import SignUpForm from "$lib/components/forms/sign-up.form.svelte";
import type { SignUpFormValue } from "$lib/components/forms/utils/schemas";

async function handleSubmit(formValue: SignUpFormValue) {
	await signUp.email({
		name: formValue.name.trim(),
		email: formValue.email,
		password: formValue.password,
	});
}
</script>

<div class="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
  <div class="w-full max-w-sm">
    <SignUpForm {handleSubmit} />
  </div>
</div>
