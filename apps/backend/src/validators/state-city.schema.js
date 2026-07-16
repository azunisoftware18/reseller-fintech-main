import { z } from 'zod';

// State by Code Schema
export const stateByCodeSchema = z.object({
  stateCode: z.string().min(1, 'State code is required'),
});
