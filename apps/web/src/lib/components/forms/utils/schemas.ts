import z from "zod";

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
