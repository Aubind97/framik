<script lang="ts">
import Input from "$lib/components/ui/input/input.svelte";
import Label from "$lib/components/ui/label/label.svelte";

let {
	name,
	errors,
	label,
	placeholder,
	value,
	type,
	handleChange,
	handleBlur,
	required = true,
}: {
	handleBlur: () => void;
	handleChange: (value: string) => void;
	type: HTMLInputElement["type"];
	value: string;
	placeholder?: string;
	label: string;
	name: string;
	required?: boolean;
	errors?: ({ message: string | undefined } | undefined)[];
} = $props();
</script>

<Label for={name} class={!!errors?.length ? 'text-destructive' : ''}>{label}</Label>
<Input id={name}
    placeholder={placeholder}
    type={type}
    value={value}
    aria-invalid={!!errors?.length}
    onblur={() => handleBlur?.()}
    oninput={(e: Event) => {
      const target = e.target as HTMLInputElement
      handleChange?.(target.value)
    }}
    required={required}
/>
{#each errors ?? [] as error}
    <p class="text-destructive text-sm">{error?.message}</p>
{/each}
