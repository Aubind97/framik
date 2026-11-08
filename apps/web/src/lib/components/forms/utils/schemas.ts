import z from "zod";
import { isAllowedHeaderName } from "#lib/immich.ts";

export const signInSchema = z.object({
	email: z.email(),
	password: z.string().min(8),
});
export type SignInFormValue = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
	email: z.email(),
	name: z.string().nonempty(),
	password: z.string().min(8),
});
export type SignUpFormValue = z.infer<typeof signUpSchema>;

export const organizationCreationSchema = z.object({
	name: z.string().nonempty(),
});
export type OrganizationCreationFormValue = z.infer<typeof organizationCreationSchema>;

export const frameCreationSchema = z.object({
	name: z.string().nonempty(),
	apiUrl: z.url().nonempty(),
});
export type FrameCreationFormValue = z.infer<typeof frameCreationSchema>;

/** Secrets already stored on the server may be left blank to keep them. */
export function createImmichIntegrationSchema(stored: { apiKeySet: boolean; headerNames: string[] }) {
	const storedHeaderNames = new Set(stored.headerNames.map((name) => name.toLowerCase()));

	return z.object({
		url: z.url(),
		apiKey: z.string().refine((apiKey) => stored.apiKeySet || apiKey.length > 0, "API key is required"),
		headers: z.array(
			z
				.object({
					name: z.string().trim().refine(isAllowedHeaderName, "Invalid header name"),
					value: z.string(),
				})
				.refine((header) => storedHeaderNames.has(header.name.trim().toLowerCase()) || header.value.length > 0, { message: "Value is required", path: ["value"] }),
		),
	});
}
export type ImmichIntegrationFormValue = z.infer<ReturnType<typeof createImmichIntegrationSchema>>;
