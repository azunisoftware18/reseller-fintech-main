import { z } from 'zod';

// Fetch Plans Schema
export const fetchPlansSchema = z.object({
  mobileNumber: z
    .string()
    .min(10, 'Mobile number must be at least 10 digits')
    .max(15, 'Mobile number too long')
    .regex(/^\d+$/, 'Mobile number must contain only digits'),

  internalOperatorCode: z
    .string()
    .min(1, 'Internal operator code is required')
    .max(20, 'Operator code too long'),

  internalCircleCode: z
    .string()
    .min(1, 'Internal circle code is required')
    .max(20, 'Circle code too long'),

  serviceProviderMappingId: z
    .string()
    .uuid('Invalid service provider mapping ID'),
});

// Perform Recharge Schema
export const performRechargeSchema = z.object({
  mobileNumber: z
    .string()
    .min(10, 'Mobile number must be at least 10 digits')
    .max(15, 'Mobile number too long')
    .regex(/^\d+$/, 'Mobile number must contain only digits'),

  internalOperatorCode: z
    .string()
    .min(1, 'Internal operator code is required')
    .max(20, 'Operator code too long'),

  amount: z
    .number()
    .positive('Amount must be positive')
    .min(1, 'Minimum recharge amount is 1'),

  serviceProviderMappingId: z
    .string()
    .uuid('Invalid service provider mapping ID'),

  // Optional: if user wants specific plan instead of amount
  planId: z.string().optional(),

  // Optional metadata
  metadata: z.record(z.any()).optional(),
});

export const rechargeHistorySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  status: z
    .enum(['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REFUNDED', 'ALL'])
    .optional()
    .default('ALL'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  mobileNumber: z.string().optional(),
  search: z.string().optional(),
});

// Check Status Schema
export const checkStatusSchema = z.object({
  transactionId: z
    .string()
    .min(1, 'Transaction ID is required')
    .regex(/^RC\d+$/, 'Invalid transaction ID format'), // Matches "RC" followed by digits});
});

export const complainSchema = z.object({
  transactionId: z.string().uuid(),
  remark: z.string().min(5).max(500),
});

export const rechargeCallbackSchema = z.object({
  status: z.enum(['SUCCESS', 'FAIL', 'PENDING']),
  opid: z.string(),
  yourtransid: z.string(),
  txnid: z.string().optional(),
  number: z.string(),
  amount: z.string(),
  message: z.string().optional(),
});
