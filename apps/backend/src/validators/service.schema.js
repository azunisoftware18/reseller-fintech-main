import { z } from 'zod';

const modeEnum = z.enum(['COMMISSION', 'SURCHARGE']);
const pricingValueTypeEnum = z.enum(['FLAT', 'PERCENTAGE']);
const commissionStartLevelEnum = z.enum(['HIERARCHY', 'AZZUNIQUE', 'NONE']);

// bigint safe validator (DB bigint → handle as string or number)
const bigintSchema = z.union([
  z.string().regex(/^\d+$/, 'Must be a valid number string'),
  z.number().int().nonnegative(),
]);

const uuidSchema = z.string().uuid('Invalid UUID');

// ================= SERVICE =================
export const createServiceSchema = z.object({
  code: z.string().min(2).max(40),

  name: z.string().min(2).max(100),

  isActive: z.boolean().optional(),
});

export const updateServiceSchema = z.object({
  code: z.string().min(2).max(40).optional(),

  name: z.string().min(2).max(100).optional(),

  isActive: z.boolean().optional(),
});

// ================= PROVIDER =================
export const createProviderSchema = z.object({
  code: z.string().min(2).max(40),

  providerName: z.string().min(2).max(100),

  handler: z.string().min(2).max(200),

  isActive: z.boolean().optional(),
});

export const updateProviderSchema = z.object({
  code: z.string().min(2).max(40).optional(),

  providerName: z.string().min(2).max(100).optional(),

  handler: z.string().min(2).max(200).optional(),

  isActive: z.boolean().optional(),
});

// ================= SERVICE PROVIDER MAPPING =================
// ================= SERVICE PROVIDER MAPPING =================
// Slab schema
const providerSlabSchema = z
  .object({
    minAmount: z.number().positive('Min amount must be positive'),
    maxAmount: z.number().positive('Max amount must be positive'),
    providerCost: z.number().positive('Provider cost must be positive'),
    isActive: z.boolean().optional().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.maxAmount <= data.minAmount) {
      ctx.addIssue({
        path: ['maxAmount'],
        message: 'Max amount must be greater than min amount',
        code: z.ZodIssueCode.custom,
      });
    }
  });

// Helper function to validate slabs for overlapping
const validateSlabs = (slabs, ctx) => {
  if (!slabs || slabs.length === 0) return;

  const sortedSlabs = [...slabs].sort((a, b) => a.minAmount - b.minAmount);

  for (let i = 0; i < sortedSlabs.length - 1; i++) {
    if (sortedSlabs[i].maxAmount >= sortedSlabs[i + 1].minAmount) {
      ctx.addIssue({
        path: ['slabs'],
        message:
          "Slabs cannot overlap. Each slab's maxAmount must be less than the next slab's minAmount",
        code: z.ZodIssueCode.custom,
      });
      break;
    }
  }
};

export const createServiceProviderMappingSchema = z
  .object({
    ServiceId: uuidSchema,
    ProviderId: uuidSchema,

    mode: modeEnum.optional(),
    pricingValueType: pricingValueTypeEnum.optional(),

    providerCost: bigintSchema.optional(),

    commissionStartLevel: commissionStartLevelEnum,

    applyTDS: z.boolean().optional().default(false),
    tdsPercent: bigintSchema.nullable().optional(),

    applyGST: z.boolean().optional().default(false),
    gstPercent: bigintSchema.nullable().optional(),

    supportsSlab: z.boolean().optional().default(false),

    config: z.object({}).catchall(z.any()).optional(),

    isActive: z.boolean().optional(),

    slabs: z.array(providerSlabSchema).optional().default([]),
  })
  .superRefine((data, ctx) => {
    // Check if commission start level is NONE
    const isCommissionStartLevelNone = data.commissionStartLevel === 'NONE';

    if (isCommissionStartLevelNone) {
      // For NONE, only ServiceId, ProviderId, commissionStartLevel, and isActive are required
      if (!data.ServiceId) {
        ctx.addIssue({
          path: ['ServiceId'],
          message: 'Service ID is required',
          code: z.ZodIssueCode.custom,
        });
      }
      if (!data.ProviderId) {
        ctx.addIssue({
          path: ['ProviderId'],
          message: 'Provider ID is required',
          code: z.ZodIssueCode.custom,
        });
      }
      if (!data.commissionStartLevel) {
        ctx.addIssue({
          path: ['commissionStartLevel'],
          message: 'Commission start level is required',
          code: z.ZodIssueCode.custom,
        });
      }
      if (data.isActive === undefined) {
        ctx.addIssue({
          path: ['isActive'],
          message: 'Status is required',
          code: z.ZodIssueCode.custom,
        });
      }
      return;
    }

    // For non-NONE commission start level, validate all fields
    if (!data.ServiceId) {
      ctx.addIssue({
        path: ['ServiceId'],
        message: 'Service ID is required',
        code: z.ZodIssueCode.custom,
      });
    }

    if (!data.ProviderId) {
      ctx.addIssue({
        path: ['ProviderId'],
        message: 'Provider ID is required',
        code: z.ZodIssueCode.custom,
      });
    }

    if (!data.commissionStartLevel) {
      ctx.addIssue({
        path: ['commissionStartLevel'],
        message: 'Commission start level is required',
        code: z.ZodIssueCode.custom,
      });
    }

    if (data.isActive === undefined) {
      ctx.addIssue({
        path: ['isActive'],
        message: 'Status is required',
        code: z.ZodIssueCode.custom,
      });
    }

    if (!data.mode) {
      ctx.addIssue({
        path: ['mode'],
        message: 'Mode is required',
        code: z.ZodIssueCode.custom,
      });
    }

    if (!data.pricingValueType) {
      ctx.addIssue({
        path: ['pricingValueType'],
        message: 'Pricing value type is required',
        code: z.ZodIssueCode.custom,
      });
    }

    // Config validation
    if (!data.config || typeof data.config !== 'object') {
      ctx.addIssue({
        path: ['config'],
        message: 'Config must be a valid object',
        code: z.ZodIssueCode.custom,
      });
    } else if (Object.keys(data.config).length === 0) {
      ctx.addIssue({
        path: ['config'],
        message: 'At least one configuration key-value pair is required',
        code: z.ZodIssueCode.custom,
      });
    }

    // Mode-specific validations
    const isCommissionMode = data.mode === 'COMMISSION';
    const isSurchargeMode = data.mode === 'SURCHARGE';

    if (isCommissionMode) {
      // Validate provider cost if slab is not supported
      if (!data.supportsSlab) {
        if (!data.providerCost && data.providerCost !== 0) {
          ctx.addIssue({
            path: ['providerCost'],
            message: 'Provider cost is required when slab is not supported',
            code: z.ZodIssueCode.custom,
          });
        } else if (
          data.providerCost !== undefined &&
          Number(data.providerCost) < 0
        ) {
          ctx.addIssue({
            path: ['providerCost'],
            message: 'Provider cost must be a positive number',
            code: z.ZodIssueCode.custom,
          });
        }
      }

      // Validate TDS
      if (data.applyTDS) {
        if (!data.tdsPercent && data.tdsPercent !== 0) {
          ctx.addIssue({
            path: ['tdsPercent'],
            message: 'tdsPercent is required when applyTDS is true',
            code: z.ZodIssueCode.custom,
          });
        } else if (data.tdsPercent !== undefined) {
          const tdsValue = Number(data.tdsPercent);
          if (tdsValue < 0 || tdsValue > 100) {
            ctx.addIssue({
              path: ['tdsPercent'],
              message: 'TDS percent must be between 0 and 100',
              code: z.ZodIssueCode.custom,
            });
          }
        }
      }
    }

    if (isSurchargeMode) {
      // Validate GST
      if (data.applyGST) {
        if (!data.gstPercent && data.gstPercent !== 0) {
          ctx.addIssue({
            path: ['gstPercent'],
            message: 'gstPercent is required when applyGST is true',
            code: z.ZodIssueCode.custom,
          });
        } else if (data.gstPercent !== undefined) {
          const gstValue = Number(data.gstPercent);
          if (gstValue < 0 || gstValue > 100) {
            ctx.addIssue({
              path: ['gstPercent'],
              message: 'GST percent must be between 0 and 100',
              code: z.ZodIssueCode.custom,
            });
          }
        }
      }
    }

    // Validate slabs
    if (data.supportsSlab) {
      if (!data.slabs || data.slabs.length === 0) {
        ctx.addIssue({
          path: ['slabs'],
          message: 'At least one slab is required when slab pricing is enabled',
          code: z.ZodIssueCode.custom,
        });
      } else {
        // Validate each slab individually (handled by providerSlabSchema)
        // Check for overlapping slabs
        validateSlabs(data.slabs, ctx);
      }
    }
  });

export const updateServiceProviderMappingSchema = z
  .object({
    ServiceId: uuidSchema.optional(),
    ProviderId: uuidSchema.optional(),

    mode: modeEnum.optional(),
    pricingValueType: pricingValueTypeEnum.optional(),

    providerCost: bigintSchema.optional(),

    commissionStartLevel: commissionStartLevelEnum.optional(),

    applyTDS: z.boolean().optional(),
    tdsPercent: bigintSchema.nullable().optional(),

    applyGST: z.boolean().optional(),
    gstPercent: bigintSchema.nullable().optional(),

    supportsSlab: z.boolean().optional(),

    config: z.object({}).catchall(z.any()).optional(),

    isActive: z.boolean().optional(),

    slabs: z.array(providerSlabSchema).optional(),
  })
  .superRefine((data, ctx) => {
    // Check if commission start level is being set to NONE
    const isCommissionStartLevelNone = data.commissionStartLevel === 'NONE';

    if (isCommissionStartLevelNone) {
      // If setting to NONE, we don't need to validate other fields
      return;
    }

    // Config validation if provided
    if (data.config !== undefined && typeof data.config !== 'object') {
      ctx.addIssue({
        path: ['config'],
        message: 'Config must be a valid object',
        code: z.ZodIssueCode.custom,
      });
    }

    // TDS validation if applyTDS is being updated
    if (data.applyTDS === true) {
      if (!data.tdsPercent && data.tdsPercent !== 0) {
        ctx.addIssue({
          path: ['tdsPercent'],
          message: 'tdsPercent is required when applyTDS is true',
          code: z.ZodIssueCode.custom,
        });
      } else if (data.tdsPercent !== undefined) {
        const tdsValue = Number(data.tdsPercent);
        if (tdsValue < 0 || tdsValue > 100) {
          ctx.addIssue({
            path: ['tdsPercent'],
            message: 'TDS percent must be between 0 and 100',
            code: z.ZodIssueCode.custom,
          });
        }
      }
    }

    // GST validation if applyGST is being updated
    if (data.applyGST === true) {
      if (!data.gstPercent && data.gstPercent !== 0) {
        ctx.addIssue({
          path: ['gstPercent'],
          message: 'gstPercent is required when applyGST is true',
          code: z.ZodIssueCode.custom,
        });
      } else if (data.gstPercent !== undefined) {
        const gstValue = Number(data.gstPercent);
        if (gstValue < 0 || gstValue > 100) {
          ctx.addIssue({
            path: ['gstPercent'],
            message: 'GST percent must be between 0 and 100',
            code: z.ZodIssueCode.custom,
          });
        }
      }
    }

    // Validate provider cost if provided
    if (data.providerCost !== undefined && Number(data.providerCost) < 0) {
      ctx.addIssue({
        path: ['providerCost'],
        message: 'Provider cost must be a positive number',
        code: z.ZodIssueCode.custom,
      });
    }

    // Validate slabs if provided
    if (data.slabs !== undefined) {
      if (data.supportsSlab === true && data.slabs.length === 0) {
        ctx.addIssue({
          path: ['slabs'],
          message: 'At least one slab is required when slab pricing is enabled',
          code: z.ZodIssueCode.custom,
        });
      } else if (data.slabs.length > 0) {
        // Validate each slab individually (handled by providerSlabSchema)
        // Check for overlapping slabs
        validateSlabs(data.slabs, ctx);
      }
    }
  });

// ================= COMMON PARAMS =================
export const idParamSchema = z.object({
  id: uuidSchema,
});

// ================= LISTING / FILTER ================
export const getServiceListSchema = z.object({
  search: z.string().optional(),
  isActive: z.boolean().optional(),

  limit: z.coerce.number().min(1).max(100).optional().default(20),
  page: z.coerce.number().min(1).optional().default(1),
});
