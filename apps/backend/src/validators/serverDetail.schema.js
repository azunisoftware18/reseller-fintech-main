import { z } from 'zod';

// CREATE SERVER DETAIL
export const serverDetailSchema = z.object({
  recordType: z.enum(['CNAME', 'IP', 'OTHER']),
  hostname: z.string().min(1).max(255), // example: api.azz.com
  value: z.string().min(1).max(100),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(), // default ACTIVE
});

// ID PARAM
export const idParamSchema = z.object({
  id: z.string().uuid('Invalid id'),
});
