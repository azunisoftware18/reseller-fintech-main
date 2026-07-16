import { z } from 'zod';

export const createTenantDomainSchema = z
  .object({
    domainName: z
      .string()
      .regex(
        /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i,
        'Invalid domain',
      ),
    tenantId: z.string().uuid().optional(),
    serverDetailId: z.string().uuid(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED']),
    actionReason: z.string().max(255).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status !== 'ACTIVE' && !data.actionReason) {
      ctx.addIssue({
        path: ['actionReason'],
        message: 'Action reason is required when status is not ACTIVE',
        code: z.ZodIssueCode.custom,
      });
    }
  });

export const idParamSchema = z.object({
  tenantId: z.string().uuid('Invalid id'),
});
