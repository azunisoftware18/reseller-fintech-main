import { z } from 'zod';

export const kycDocumentSchema = z.object({
  documentType: z.enum([
    'PAN',
    'AADHAAR_FRONT',
    'AADHAAR_BACK',
    'ADDRESS_PROOF',
    'USER_PHOTO',
  ]),
  documentNumber: z.string().min(1).max(255).optional().nullable(),
  documentUrl: z.string().url().max(500).optional().nullable(),
});

export const personalInfoSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  fatherName: z.string().max(100).optional().nullable(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
});

export const addressSchema = z.object({
  address: z.string().min(5).max(500),
  pinCode: z.string().regex(/^\d{6}$/),
  stateId: z.string().uuid(),
  cityId: z.string().uuid(),
});

export const submitKycSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  personalInfo: personalInfoSchema,
  address: addressSchema,
  documents: z.array(kycDocumentSchema).min(5, 'All 5 documents are required'),
});

export const resubmitKycSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  kycId: z.string().uuid('Invalid KYC ID'),
  personalInfo: personalInfoSchema,
  address: addressSchema,
  documents: z.array(kycDocumentSchema).min(5, 'All 5 documents are required'),
});

export const approveKycSchema = z.object({
  kycId: z.string().uuid('Invalid KYC ID'),
  approvalNotes: z.string().max(1000).optional(),
});

export const rejectKycSchema = z.object({
  kycId: z.string().uuid('Invalid KYC ID'),
  rejectionReason: z
    .string()
    .min(10)
    .max(500, 'Rejection reason must be between 10 and 500 characters'),
});

export const userIdParamSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

export const listKycQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
  tenantId: z.string().uuid().optional(),
  status: z
    .enum(['PENDING', 'REJECTED', 'VERIFIED', 'ALL'])
    .optional()
    .default('PENDING'),
});
