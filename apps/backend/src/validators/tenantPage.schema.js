import { z } from 'zod';

export const createTenantPageSchema = z.object({
  pageTitle: z.string().min(3).max(255),
  pageContent: z.string().optional(),
  pageUrl: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9-/]+$/, 'Invalid page URL'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});

export const updateTenantPageSchema = z.object({
  pageTitle: z.string().min(3).max(255).optional(),
  pageContent: z.string().optional(),
  pageUrl: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9-/]+$/, 'Invalid page URL')
    .optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});

export const idParamSchema = z.object({
  id: z.string().uuid(),
});
