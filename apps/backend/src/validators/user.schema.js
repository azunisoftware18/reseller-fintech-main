import { z } from 'zod';

export const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user id'),
});

export const createUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),

  email: z.string().email(),
  mobileNumber: z.string().regex(/^[0-9]{10,15}$/),

  roleId: z.string().uuid(),
  tenantId: z.string().uuid().optional(),
});

export const updateUserSchema = z
  .object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),

    email: z.string().email().optional(),
    mobileNumber: z
      .string()
      .regex(/^[0-9]{10,15}$/)
      .optional(),

    profilePicture: z.string().max(255).optional(),
    userStatus: z
      .enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'])
      .optional(),
    actionReason: z.string().max(500).optional(),
    roleId: z.string().uuid().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      (data.userStatus === 'INACTIVE' ||
        data.userStatus === 'SUSPENDED' ||
        data.userStatus === 'DELETED') &&
      !data.actionReason
    ) {
      ctx.addIssue({
        path: ['actionReason'],
        message:
          'Action reason is required when status is INACTIVE or SUSPENDED or DELETED',
        code: z.ZodIssueCode.custom,
      });
    }
  });

export const listUsersQuerySchema = z.object({
  status: z
    .enum(['ALL', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'])
    .optional(),
});

export const hierarchyParamSchema = z.object({
  id: z.string().uuid(),
});

export const assignUserPermissionsSchema = z.object({
  permissions: z
    .array(
      z.object({
        permissionId: z.string().uuid('Invalid permission id'),
        effect: z.enum(['ALLOW', 'DENY']),
      }),
    )
    .min(1, 'At least one permission is required'),
});
