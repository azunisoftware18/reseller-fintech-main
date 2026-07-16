import { z } from 'zod';

export const auditLogListQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),

  search: z.string().min(1).max(100).optional(),

  entityType: z
    .enum([
      'USER',
      'TRANSACTION',
      'WALLET',
      'KYC',
      'COMMISSION',
      'SERVICE',
      'ALL',
    ])
    .optional()
    .default('ALL'),

  action: z
    .enum([
      'CREATE',
      'UPDATE',
      'DELETE',
      'LOGIN',
      'LOGOUT',
      'VERIFY',
      'REJECT',
      'APPROVE',
      'ALL',
    ])
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
    .enum(['createdAt', 'entityType', 'action', 'performByUserId'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
