import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(3, 'Identifier is required')
    .max(255, 'Identifier too long'),

  password: z.string().min(8, 'Password must be at least 8 characters'),

  type: z.enum(['USER', 'EMPLOYEE'], {
    errorMap: () => ({ message: 'Type must be USER or EMPLOYEE' }),
  }),

  latitude: z
    .number({
      required_error: 'Latitude is required',
      invalid_type_error: 'Latitude must be a number',
    })
    .nullable(),

  longitude: z
    .number({
      required_error: 'Longitude is required',
      invalid_type_error: 'Longitude must be a number',
    })
    .nullable(),

  accuracy: z
    .number({
      invalid_type_error: 'Accuracy must be a number',
    })
    .nullable(),
});
