import { z } from 'zod';

export const performPayoutSchema = z.object({
  beneficiaryAccount: z
    .string()
    .min(1, 'Beneficiary account is required')
    .max(16, 'Account number must be max 16 characters (RBL requirement)')
    .regex(
      /^[a-zA-Z0-9]+$/,
      'Account number must be alphanumeric (no special characters)',
    ),

  beneficiaryIfsc: z
    .string()
    .min(1, 'IFSC code is required for NEFT/RTGS/IMPS')
    .max(15, 'IFSC code must be max 15 characters')
    .regex(/^[a-zA-Z0-9]+$/, 'IFSC code must be alphanumeric'),

  beneficiaryName: z
    .string()
    .min(1, 'Beneficiary name is required')
    .max(50, 'Name must be max 50 characters (RBL requirement)'),

  beneficiaryBankName: z
    .string()
    .max(100, 'Bank name must be max 100 characters')
    .regex(/^[a-zA-Z0-9\s.&-]+$/, 'Bank name contains invalid characters')
    .optional(),

  amount: z
    .number()
    .positive('Amount must be positive')
    .refine((val) => {
      // Check for max 2 decimal places
      return Number.isInteger(val * 100);
    }, 'Amount can have at most 2 decimal places'),

  mode: z.enum(['NEFT', 'RTGS', 'IMPS', 'FT'], {
    errorMap: () => ({
      message: 'Invalid payout mode. Allowed: NEFT, RTGS, IMPS, FT',
    }),
  }),

  serviceProviderMappingId: z
    .string()
    .uuid('Invalid service provider mapping ID'),

  remarks: z
    .string()
    .max(50, 'Remarks must be max 50 characters (RBL requirement)')
    .optional(),

  // RBL-specific fields
  beneficiaryMobile: z
    .string()
    .length(10, 'Beneficiary mobile number must be exactly 10 digits')
    .regex(/^\d+$/, 'Beneficiary mobile must contain only digits')
    .optional(),
});

export const payoutHistorySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  status: z
    .enum(['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REFUNDED', 'ALL'])
    .optional()
    .default('ALL'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  beneficiaryAccount: z.string().optional(),
  search: z.string().optional(),
});

export const checkStatusSchema = z.object({
  transactionId: z
    .string()
    .min(1, 'Transaction ID is required')
    .regex(/^PY\d+$/, 'Invalid transaction ID format'),
});
