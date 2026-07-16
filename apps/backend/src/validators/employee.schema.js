import { z } from 'zod';

// CREATE EMPLOYEE
export const createEmployeeSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  mobileNumber: z.string().regex(/^[0-9]{10,15}$/, 'Invalid mobile number'),
  departmentId: z.string().uuid(),
});

// UPDATE EMPLOYEE
export const updateEmployeeSchema = z
  .object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
    mobileNumber: z
      .string()
      .regex(/^[0-9]{10,15}$/, 'Invalid mobile number')
      .optional(),
    profilePicture: z.string().max(255).optional(),
    employeeStatus: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
    actionReason: z.string().max(500).optional(),
    departmentId: z.string().uuid().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      (data.employeeStatus === 'INACTIVE' ||
        data.employeeStatus === 'SUSPENDED') &&
      !data.actionReason
    ) {
      ctx.addIssue({
        path: ['actionReason'],
        message:
          'Action reason is required when status is INACTIVE or SUSPENDED',
        code: z.ZodIssueCode.custom,
      });
    }
  });

// ID PARAM
export const idParamSchema = z.object({
  id: z.string().uuid('Invalid id'),
});

export const assignEmployeePermissionsSchema = z.object({
  permissions: z
    .array(
      z.object({
        permissionId: z.string().uuid('Invalid permission id'),
        effect: z.enum(['ALLOW', 'DENY']),
      }),
    )
    .min(1, 'At least one permission is required'),
});
