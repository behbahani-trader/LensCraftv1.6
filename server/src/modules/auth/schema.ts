import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6)
});

export const loginSchema = registerSchema;
