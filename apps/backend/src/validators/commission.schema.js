import { z } from 'zod';

const slabSchema = z
  .object({
    minAmount: z.number().int().min(1, 'Min amount must be 1 or greater'),
    maxAmount: z.number().int().min(1, 'Max amount must be 1 or greater'),
    value: z
      .number()
      .min(0.01, 'Slab value must be greater than 0')
      .refine((val) => Number.isInteger(val * 100), {
        message: 'Max 2 decimal places allowed',
      }),
  })
  .superRefine((data, ctx) => {
    if (data.maxAmount <= data.minAmount) {
      ctx.addIssue({
        path: ['maxAmount'],
        code: 'custom',
        message: `Max amount (${data.maxAmount}) must be greater than min amount (${data.minAmount})`,
      });
    }
  });

const baseCommissionSchema = {
  serviceProviderMappingId: z.string().uuid('Invalid service mapping ID'),
  mode: z.enum(['COMMISSION', 'SURCHARGE']),
  type: z.enum(['FLAT', 'PERCENTAGE']),
  value: z
    .number()
    .min(0.01)
    .refine((val) => Number.isInteger(val * 100), {
      message: 'Max 2 decimal places allowed',
    })
    .optional()
    .nullable(),
  applyTDS: z.boolean().default(false),
  tdsPercent: z.number().min(0).max(100).optional().nullable(),
  applyGST: z.boolean().default(false),
  gstPercent: z.number().min(0).max(100).optional().nullable(),
  supportsSlab: z.boolean().default(false),
  slabs: z.array(slabSchema).default([]),
  isActive: z.boolean().default(true),
};

export const createCommissionSchema = z
  .object({
    scope: z.enum(['USER', 'ROLE']),
    targetUserId: z.string().uuid().nullable().optional(),
    roleId: z.string().uuid().nullable().optional(),
    ...baseCommissionSchema,
  })
  .superRefine((data, ctx) => {
    // Scope validation
    if (data.scope === 'USER') {
      if (!data.targetUserId) {
        ctx.addIssue({
          path: ['targetUserId'],
          code: 'custom',
          message: 'Target user is required when scope is USER',
        });
      }
      if (data.roleId) {
        ctx.addIssue({
          path: ['roleId'],
          code: 'custom',
          message: 'Role ID should not be provided when scope is USER',
        });
      }
    }

    if (data.scope === 'ROLE') {
      if (!data.roleId) {
        ctx.addIssue({
          path: ['roleId'],
          code: 'custom',
          message: 'Role is required when scope is ROLE',
        });
      }
      if (data.targetUserId) {
        ctx.addIssue({
          path: ['targetUserId'],
          code: 'custom',
          message: 'Target user should not be provided when scope is ROLE',
        });
      }
    }

    // Non-slab validation
    if (!data.supportsSlab) {
      if (data.value === undefined || data.value === null) {
        ctx.addIssue({
          path: ['value'],
          code: 'custom',
          message: 'Value is required when slab support is disabled',
        });
      }
      if (data.value === 0) {
        ctx.addIssue({
          path: ['value'],
          code: 'custom',
          message: 'Value cannot be zero. Use isActive to disable instead',
        });
      }
      if (data.slabs && data.slabs.length > 0) {
        ctx.addIssue({
          path: ['slabs'],
          code: 'custom',
          message: 'Slabs must be empty when slab support is disabled',
        });
      }
    }

    // Slab validation
    if (data.supportsSlab) {
      if (data.value !== undefined && data.value !== null) {
        ctx.addIssue({
          path: ['value'],
          code: 'custom',
          message: 'Value must not be provided when slab support is enabled',
        });
      }

      if (!data.slabs || data.slabs.length === 0) {
        ctx.addIssue({
          path: ['slabs'],
          code: 'custom',
          message: 'At least one slab is required when slab support is enabled',
        });
      } else {
        validateSlabsInSchema(data.slabs, ctx);
      }
    }

    // Tax validation
    if (data.applyTDS && data.mode !== 'COMMISSION') {
      ctx.addIssue({
        path: ['applyTDS'],
        code: 'custom',
        message: 'TDS can only be applied to COMMISSION mode',
      });
    }

    if (data.applyGST && data.mode !== 'SURCHARGE') {
      ctx.addIssue({
        path: ['applyGST'],
        code: 'custom',
        message: 'GST can only be applied to SURCHARGE mode',
      });
    }

    if (
      data.applyTDS &&
      (data.tdsPercent === undefined || data.tdsPercent === null)
    ) {
      ctx.addIssue({
        path: ['tdsPercent'],
        code: 'custom',
        message: 'TDS percentage is required when TDS is enabled',
      });
    }

    if (
      data.applyGST &&
      (data.gstPercent === undefined || data.gstPercent === null)
    ) {
      ctx.addIssue({
        path: ['gstPercent'],
        code: 'custom',
        message: 'GST percentage is required when GST is enabled',
      });
    }
  });

export const updateCommissionSchema = z
  .object({
    serviceProviderMappingId: z
      .string()
      .uuid('Invalid service mapping ID')
      .optional(),
    mode: z.enum(['COMMISSION', 'SURCHARGE']).optional(),
    type: z.enum(['FLAT', 'PERCENTAGE']).optional(),
    value: z
      .number()
      .min(0.01)
      .refine((val) => Number.isInteger(val * 100), {
        message: 'Max 2 decimal places allowed',
      })
      .optional()
      .nullable(),
    applyTDS: z.boolean().optional(),
    tdsPercent: z.number().min(0).max(100).optional().nullable(),
    applyGST: z.boolean().optional(),
    gstPercent: z.number().min(0).max(100).optional().nullable(),
    supportsSlab: z.boolean().optional(),
    slabs: z.array(slabSchema).optional(),
    isActive: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.supportsSlab === true && data.value !== undefined) {
      ctx.addIssue({
        path: ['value'],
        code: 'custom',
        message: 'Value cannot be set when slab support is enabled',
      });
    }

    if (data.supportsSlab === false && data.slabs && data.slabs.length > 0) {
      ctx.addIssue({
        path: ['slabs'],
        code: 'custom',
        message: 'Slabs cannot be set when slab support is disabled',
      });
    }

    if (data.supportsSlab === true && data.slabs && data.slabs.length > 0) {
      validateSlabsInSchema(data.slabs, ctx);
    }

    // Tax validation for updates
    if (data.applyTDS === true && data.mode === 'SURCHARGE') {
      ctx.addIssue({
        path: ['applyTDS'],
        code: 'custom',
        message: 'TDS cannot be applied to surcharges',
      });
    }

    if (data.applyGST === true && data.mode === 'COMMISSION') {
      ctx.addIssue({
        path: ['applyGST'],
        code: 'custom',
        message: 'GST cannot be applied to commissions',
      });
    }
  });

function validateSlabsInSchema(slabs, ctx) {
  const sortedSlabs = [...slabs].sort((a, b) => a.minAmount - b.minAmount);

  for (let i = 0; i < sortedSlabs.length; i++) {
    const current = sortedSlabs[i];

    if (i === 0 && current.minAmount !== 1) {
      ctx.addIssue({
        path: [`slabs.${i}.minAmount`],
        code: 'custom',
        message: 'First slab must start from minAmount 1',
      });
    }

    if (current.maxAmount === 0) {
      ctx.addIssue({
        path: [`slabs.${i}.maxAmount`],
        code: 'custom',
        message:
          'Unlimited slab (maxAmount = 0) is not allowed. Please specify a maxAmount.',
      });
    }

    if (current.maxAmount <= current.minAmount) {
      ctx.addIssue({
        path: [`slabs.${i}.maxAmount`],
        code: 'custom',
        message: 'maxAmount must be greater than minAmount',
      });
    }

    if (current.value <= 0) {
      ctx.addIssue({
        path: [`slabs.${i}.value`],
        code: 'custom',
        message: 'value must be greater than 0',
      });
    }

    if (i > 0) {
      const previous = sortedSlabs[i - 1];

      if (current.minAmount <= previous.maxAmount) {
        ctx.addIssue({
          path: [`slabs.${i}.minAmount`],
          code: 'custom',
          message: `Overlap detected: previous slab ends at ${previous.maxAmount}, current slab starts at ${current.minAmount}. Slabs must not overlap.`,
        });
      }

      if (current.minAmount !== previous.maxAmount + 1) {
        ctx.addIssue({
          path: [`slabs.${i}.minAmount`],
          code: 'custom',
          message: `Gap detected: expected next slab to start at ${previous.maxAmount + 1} but got ${current.minAmount}. Slabs must be continuous without gaps.`,
        });
      }
    }
  }
}

export const commissionListQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
});
