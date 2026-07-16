import { z } from 'zod';

export const createFundTransactionSchema = z.object({
  amount: z
    .number({
      required_error: 'Amount is required',
      invalid_type_error: 'Amount must be a number',
    })
    .int()
    .positive()
    .min(100, 'Minimum fund request is ₹100')
    .max(1000000, 'Maximum fund limit is ₹10,00,000'),

  idempotencyKey: z.string().min(8),
  paymentMode: z.string(),
  providerTxnId: z.string().optional(),
});

export const changeFundStatusSchema = z
  .object({
    status: z.enum(['SUCCESS', 'REJECTED']),
    failureReason: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === 'REJECTED' && !data.failureReason) {
      ctx.addIssue({
        path: ['failureReason'],
        code: z.ZodIssueCode.custom,
        message: 'Rejection reason is required',
      });
    }
  });

export const fundTransactionIdParamSchema = z.object({
  id: z.string().uuid(),
});
