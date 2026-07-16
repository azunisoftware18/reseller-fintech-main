import { z } from 'zod';

export const roleHierarchySchema = z.object({
  parentRoleId: z.string().uuid('Invalid parentRoleId'),
  childRoleId: z.string().uuid('Invalid childRoleId'),
});
