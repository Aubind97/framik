import { svelteKitHandler } from "better-auth/svelte-kit";
import { auth } from "$lib/auth"; // path to your auth file

export async function handle({ event, resolve }) {
	return svelteKitHandler({ event, resolve, auth });
}
