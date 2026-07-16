import { z } from 'zod';

export const refundListQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),

  search: z.string().min(1).max(100).optional(),

  status: z
    .enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'ALL'])
    .optional()
    .default('ALL'),

  fromDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  toDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),

  sortBy: z
    .enum([
      'createdAt',
      'updatedAt',
      'amount',
      'status',
      'initiatedAt',
      'completedAt',
    ])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
