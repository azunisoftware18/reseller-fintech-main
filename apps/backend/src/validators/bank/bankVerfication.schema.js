import { z } from 'zod';

export const pennyDropSchema = z.object({
  account_number: z
    .string()
    .min(9, 'Account number must be at least 9 digits')
    .max(18, 'Account number must be max 18 digits')
    .regex(/^\d+$/, 'Account number must contain only digits'),

  ifsc_code: z
    .string()
    .length(11, 'IFSC code must be exactly 11 characters')
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC format (e.g., SBIN0123456)'),
});
