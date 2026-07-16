import { z } from 'zod';

export const upsertCircleMapSchema = z.object({
  serviceProviderMappingId: z.string().uuid(),
  internalCircleCode: z.string().min(1),
  providerCircleCode: z.string().min(1),
  direction: z.enum(['PLAN_FETCH', 'RECHARGE_EXECUTE']),
});
