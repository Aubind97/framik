import adapter from "@sveltejs/adapter-node";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { withPwa } from "@vite-pwa/sveltekit";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [
		tailwindcss(),
		withPwa(
			{
				preprocess: vitePreprocess(),
				compilerOptions: { runes: true },
				adapter: adapter(),
			},
			{
				registerType: "autoUpdate",
				generateSW: {
					globPatterns: ["client/**/*.{js,css,html,svg,png,ico,woff,woff2,webmanifest}"],
					globStrict: false,
				},
			},
		),
	],
	preview: {
		allowedHosts: true,
	},
});
