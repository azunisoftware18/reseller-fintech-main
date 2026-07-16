import { z } from 'zod';

export const verifyPanSchema = z.object({
  panNumber: z
    .string()
    .length(10)
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/),

  idempotencyKey: z.string().min(10),
});
