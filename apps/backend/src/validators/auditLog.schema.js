import { z } from 'zod';

export const createAuditLogSchema = z.object({
  entityType: z.string().min(2),
  entityId: z.string().uuid(),

  action: z.string().min(2),

  oldData: z.any().optional(),
  newData: z.any().optional(),

  performByUserId: z.string().uuid(),
  performByEmployeeId: z.string().uuid().optional(),

  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),

  tenantId: z.string().uuid(),
  metaData: z.any().optional(),
});

export const getAuditLogsSchema = z.object({
  tenantId: z.string().uuid(),
  entityType: z.string().optional(),
  entityId: z.string().uuid().optional(),
  action: z.string().optional(),
});
