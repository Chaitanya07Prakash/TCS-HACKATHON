import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    branch: z.string().optional(),
    year: z.number().int().min(1).max(5).optional(),
    semester: z.number().int().min(1).max(10).optional(),
    graduationYear: z.number().int().optional(),
    cgpa: z.number().min(0).max(10).optional(),
    skills: z.array(z.string()).optional(),
    interests: z.array(z.string()).optional(),
    placementPreference: z.object({
      name: z.string().optional(),
      preferredRoles: z.array(z.string()).optional(),
      expectedCtc: z.number().optional(),
      locations: z.array(z.string()).optional(),
    }).optional(),
  }),
});
