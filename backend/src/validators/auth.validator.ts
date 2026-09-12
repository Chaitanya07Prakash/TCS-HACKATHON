import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
    branch: z.string(),
    year: z.number().int().min(1).max(5),
    semester: z.number().int().min(1).max(10),
    graduationYear: z.number().int().min(2020),
    cgpa: z.number().min(0).max(10),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
});
