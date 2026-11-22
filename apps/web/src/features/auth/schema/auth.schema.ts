import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('Please enter a valid email address'),
  password: z.string().min(8, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 charecters'),
  email: z.email('Please enter a valid email address'),
  password: z.string().trim().min(8, 'Password must be 8 characters'),
});

export type loginForm = z.infer<typeof loginSchema>;
export type registerForm = z.infer<typeof registerSchema>;
