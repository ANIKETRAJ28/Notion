import { z } from 'zod';

export const registerUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().trim().max(255),
  password: z.string().trim().min(8).max(72),
});

export const loginUserSchema = z.object({
  email: z.email().trim().max(255),
  password: z.string().trim().min(8).max(72),
});

export type IRegisterUser = z.infer<typeof registerUserSchema>;

export type IUserLogin = z.infer<typeof loginUserSchema>;

export interface IUserWithPassword {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export type IUser = Omit<IUserWithPassword, 'password_hash'>;
