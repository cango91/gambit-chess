import { z } from 'zod';

export const UserCreateInputSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  username: z.string().min(3, { message: "Username must be at least 3 characters long" }).max(20, { message: "Username must be at most 20 characters long" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long" }),
  anonymousId: z.string().uuid().optional(), // Optional anonymous ID
});

export const UserLoginInputSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string(),
  rememberMe: z.boolean().optional().default(false),
  anonymousId: z.string().uuid().optional(), // Optional anonymous ID
});

export type UserCreateInput = z.infer<typeof UserCreateInputSchema>;
export type UserLoginInput = z.infer<typeof UserLoginInputSchema>; 