import { z } from 'zod';

export const bankDetailSchema = z.object({
  bankId: z.string().uuid('Invalid bank ID'),
  bankName: z.string().min(2).max(255),
  accountHolderName: z.string().min(2).max(255),
  accountNumber: z.string().min(1).max(255),
  ifscCode: z.string().min(4).max(255),
  branchName: z.string().min(2).max(255),
  isPrimary: z.boolean().default(false),
});

export const submitBankDetailSchema = z.object({
  userId: z.string().uuid('Invalid user ID').optional(),
  bankDetail: bankDetailSchema,
});

export const resubmitBankDetailSchema = z.object({
  userId: z.string().uuid('Invalid user ID').optional(),
  bankDetailId: z.string().uuid('Invalid bank detail ID'),
  bankDetail: bankDetailSchema,
});

export const approveBankDetailSchema = z.object({
  bankDetailId: z.string().uuid('Invalid bank detail ID'),
  approvalNotes: z.string().max(1000).optional(),
});

export const rejectBankDetailSchema = z.object({
  bankDetailId: z.string().uuid('Invalid bank detail ID'),
  rejectionReason: z
    .string()
    .min(10)
    .max(500, 'Rejection reason must be between 10 and 500 characters'),
});

export const bankDetailIdParamSchema = z.object({
  bankDetailId: z.string().uuid('Invalid bank detail ID'),
});

export const userIdParamSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

export const listBankDetailQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
  tenantId: z.string().uuid().optional(),
  status: z
    .enum(['PENDING', 'REJECTED', 'VERIFIED', 'ALL'])
    .optional()
    .default('PENDING'),
});

export const updateBankDetailSchema = z.object({
  bankDetailId: z.string().uuid('Invalid bank detail ID'),
  bankDetail: bankDetailSchema.partial(),
});

export const getAllBanksQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => parseInt(val) || 1),
  limit: z
    .string()
    .optional()
    .transform((val) => parseInt(val) || 100),
  search: z.string().optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

export const bankIdParamSchema = z.object({
  bankId: z.string().min(1, 'Bank ID is required'),
});
