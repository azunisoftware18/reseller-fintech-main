import { z } from 'zod';

// Transaction list query schema
export const transactionListQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),

  search: z.string().min(1).max(100).optional(),

  status: z
    .enum(['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REFUNDED', 'ALL'])
    .optional()
    .default('ALL'),

  serviceType: z
    .enum(['RECHARGE', 'PAYOUT', 'BILL_PAYMENT', 'DMT', 'ALL'])
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
    .enum(['initiatedAt', 'amount', 'status', 'serviceType'])
    .optional()
    .default('initiatedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Transaction earnings list query schema
export const transactionEarningsListQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),

  search: z.string().min(1).max(100).optional(),

  mode: z.enum(['COMMISSION', 'SURCHARGE', 'ALL']).optional().default('ALL'),
  status: z
    .enum(['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'ALL'])
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
    .enum(['createdAt', 'value', 'finalAmount', 'mode', 'status'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
