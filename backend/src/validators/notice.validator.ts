import { z } from 'zod';

export const processNoticeSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    rawText: z.string().min(1),
  }),
});
