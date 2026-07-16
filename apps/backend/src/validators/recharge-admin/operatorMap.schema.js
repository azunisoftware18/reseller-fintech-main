import { z } from 'zod';

export const upsertOperatorMapSchema = z.object({
  serviceProviderMappingId: z.string().uuid(),
  internalOperatorCode: z.string().min(1),
  providerOperatorCode: z.string().min(1),
  direction: z.enum(['PLAN_FETCH', 'RECHARGE_EXECUTE']),
});
