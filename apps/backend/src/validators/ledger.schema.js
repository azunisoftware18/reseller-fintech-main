import { z } from 'zod';

export const ledgerListQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),

  search: z.string().min(1).max(100).optional(),

  entryType: z
    .enum(['DEBIT', 'CREDIT', 'BLOCK', 'UNBLOCK', 'ALL'])
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
    .enum(['createdAt', 'amount', 'entryType'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const ledgerIdParamSchema = z.object({
  ledgerId: z.string().uuid('Invalid ledger ID'),
});
