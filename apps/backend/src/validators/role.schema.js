import { z } from 'zod';

export const roleIdParamSchema = z.object({
  id: z.string().uuid('Invalid role id'),
});

export const ROLE_CODES = [
  'AZZUNIQUE',
  'RESELLER',
  'WHITE_LABEL',
  'STATE_HEAD',
  'MASTER_DISTRIBUTOR',
  'DISTRIBUTOR',
  'RETAILER',
];

export const createRoleSchema = z.object({
  roleCode: z.enum(ROLE_CODES),

  roleName: z
    .string()
    .min(2, 'Role name must be at least 2 characters')
    .max(100),

  roleDescription: z.string().max(255).optional(),
});

export const updateRoleSchema = z
  .object({
    roleCode: z
      .string()
      .min(2)
      .max(50)
      .transform((v) => v.toUpperCase())
      .optional(),

    roleName: z.string().min(2).max(100).optional(),
    roleDescription: z.string().max(255).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isSystem === true) {
      ctx.addIssue({
        path: ['isSystem'],
        message: 'System roles cannot be modified',
      });
    }
  });

export const assignRolePermissionsSchema = z.object({
  permissionIds: z
    .array(z.string().uuid('Invalid permission id'))
    .min(1, 'At least one permission is required'),
});
