import { z } from "zod";

export const PASSWORD_RULES = "At least 8 characters, with an uppercase letter, a lowercase letter and a number.";

// Trim first: autofill and phone keyboards often add a trailing space.
const email = z.string().trim().toLowerCase().max(254).pipe(z.email("Enter a valid email address."));

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Use 72 characters or fewer.")
  .regex(/[a-z]/, "Add a lowercase letter.")
  .regex(/[A-Z]/, "Add an uppercase letter.")
  .regex(/[0-9]/, "Add a number.");

export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Tell us what to call you.").max(60, "Keep it under 60 characters."),
  email,
  password: passwordSchema,
  acceptTerms: z.literal(true, { error: "Please accept the terms and privacy policy to continue." }),
  timezone: z.string().max(64).optional(),
});

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
  next: z.string().optional(),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: "The passwords don't match.", path: ["confirm"] });

export type SignUpInput = z.input<typeof signUpSchema>;
export type SignInInput = z.input<typeof signInSchema>;
export type ForgotPasswordInput = z.input<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.input<typeof resetPasswordSchema>;
