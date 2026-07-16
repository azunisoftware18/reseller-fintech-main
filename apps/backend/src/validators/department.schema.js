import { z } from 'zod';

export const departmentIdParamSchema = z.object({
  id: z.string().uuid('Invalid department id'),
});

export const createDepartmentSchema = z.object({
  departmentCode: z
    .string()
    .min(2)
    .max(50)
    .transform((v) => v.toUpperCase()),

  departmentName: z.string().min(2).max(100),

  departmentDescription: z.string().max(255).optional(),
});

export const updateDepartmentSchema = z.object({
  departmentCode: z
    .string()
    .min(2)
    .max(50)
    .transform((v) => v.toUpperCase())
    .optional(),

  departmentName: z.string().min(2).max(100).optional(),

  departmentDescription: z.string().max(255).optional(),
});

export const assignDepartmentPermissionsSchema = z.object({
  permissionIds: z
    .array(z.string().uuid('Invalid permission id'))
    .min(1, 'At least one permission is required'),
});
