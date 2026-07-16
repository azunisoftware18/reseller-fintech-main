import { randomUUID } from 'crypto';
import { db } from '../database/core/core-db.js';
import {
  ServiceTable,
  ProviderTable,
  ServiceProviderMappingTable,
  ProviderSlabTable,
} from '../models/core/index.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import { ApiError } from '../lib/ApiError.js';
import { paiseToRupees, rupeesToPaise } from '../lib/lib.js';
import { resolvePermissions } from './permission.resolver.js';

export class ServiceService {
  static async create(payload) {
    let { code, name, isActive = true } = payload;

    code = code?.trim().toUpperCase();
    name = name?.trim();

    const [existing] = await db
      .select({ id: ServiceTable.id })
      .from(ServiceTable)
      .where(eq(ServiceTable.code, code))
      .limit(1);

    if (existing) {
      throw ApiError.conflict('Service code already exists');
    }

    const id = randomUUID();

    await db.insert(ServiceTable).values({
      id,
      code,
      name,
      isActive,
    });

    return {
      id,
      code,
      name,
      isActive,
    };
  }

  static async getAll(filters = {}) {
    const { search, isActive, limit = 20, page = 1 } = filters;

    const safeLimit = Math.min(Number(limit) || 20, 100);
    const safePage = Number(page) || 1;
    const offset = (safePage - 1) * safeLimit;

    const conditions = [];

    if (search) {
      const searchValue = `%${search}%`;
      conditions.push(
        sql`(${ServiceTable.name} LIKE ${searchValue} 
        OR ${ServiceTable.code} LIKE ${searchValue})`,
      );
    }

    if (typeof isActive !== 'undefined') {
      conditions.push(eq(ServiceTable.isActive, isActive));
    }

    const data = await db
      .select()
      .from(ServiceTable)
      .where(and(...conditions))
      .orderBy(desc(ServiceTable.createdAt))
      .limit(safeLimit)
      .offset(offset);

    const [{ total }] = await db
      .select({
        total: sql`COUNT(*)`.mapWith(Number),
      })
      .from(ServiceTable)
      .where(and(...conditions));

    return {
      data,
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  static async update(id, payload) {
    let { code, name, isActive } = payload;

    if (code) code = code.trim().toUpperCase();
    if (name) name = name.trim();

    const [existing] = await db
      .select({ id: ServiceTable.id })
      .from(ServiceTable)
      .where(eq(ServiceTable.id, id))
      .limit(1);

    if (!existing) {
      throw ApiError.notFound('Service not found');
    }

    if (code) {
      const [duplicate] = await db
        .select({ id: ServiceTable.id })
        .from(ServiceTable)
        .where(
          and(eq(ServiceTable.code, code), sql`${ServiceTable.id} != ${id}`),
        )
        .limit(1);

      if (duplicate) {
        throw ApiError.conflict('Service code already exists');
      }
    }

    await db
      .update(ServiceTable)
      .set({
        ...(code && { code }),
        ...(name && { name }),
        ...(typeof isActive !== 'undefined' && { isActive }),
        updatedAt: new Date(),
      })
      .where(eq(ServiceTable.id, id));

    return {
      message: 'Service updated successfully',
      id,
    };
  }
}

export class ProviderService {
  static async create(payload) {
    let { code, providerName, handler, isActive = true } = payload;

    code = code?.trim().toUpperCase();
    providerName = providerName?.trim();
    handler = handler?.trim();

    const [existing] = await db
      .select({ id: ProviderTable.id })
      .from(ProviderTable)
      .where(eq(ProviderTable.code, code))
      .limit(1);

    if (existing) {
      throw ApiError.conflict('Provider code already exists');
    }

    const id = randomUUID();

    await db.insert(ProviderTable).values({
      id,
      code,
      providerName,
      handler,
      isActive,
    });

    return {
      id,
      code,
      providerName,
      handler,
      isActive,
    };
  }

  static async getAll(filters = {}) {
    const { search, isActive, limit = 20, page = 1 } = filters;

    const safeLimit = Math.min(Number(limit) || 20, 100);
    const safePage = Number(page) || 1;
    const offset = (safePage - 1) * safeLimit;

    const conditions = [];

    if (search) {
      const searchValue = `%${search}%`;
      conditions.push(
        sql`(${ProviderTable.providerName} LIKE ${searchValue} 
        OR ${ProviderTable.code} LIKE ${searchValue}
        OR ${ProviderTable.handler} LIKE ${searchValue})`,
      );
    }

    if (typeof isActive !== 'undefined') {
      conditions.push(eq(ProviderTable.isActive, isActive));
    }

    const data = await db
      .select()
      .from(ProviderTable)
      .where(and(...conditions))
      .orderBy(desc(ProviderTable.createdAt))
      .limit(safeLimit)
      .offset(offset);

    const [{ total }] = await db
      .select({
        total: sql`COUNT(*)`.mapWith(Number),
      })
      .from(ProviderTable)
      .where(and(...conditions));

    return {
      data,
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  static async update(id, payload) {
    let { code, providerName, handler, isActive } = payload;

    if (code) code = code.trim().toUpperCase();
    if (providerName) providerName = providerName.trim();
    if (handler) handler = handler.trim();

    const [existing] = await db
      .select({ id: ProviderTable.id })
      .from(ProviderTable)
      .where(eq(ProviderTable.id, id))
      .limit(1);

    if (!existing) {
      throw ApiError.notFound('Provider not found');
    }

    if (code) {
      const [duplicate] = await db
        .select({ id: ProviderTable.id })
        .from(ProviderTable)
        .where(
          and(eq(ProviderTable.code, code), sql`${ProviderTable.id} != ${id}`),
        )
        .limit(1);

      if (duplicate) {
        throw ApiError.conflict('Provider code already exists');
      }
    }

    const updateData = {
      ...(code && { code }),
      ...(providerName && { providerName }),
      ...(handler && { handler }),
      ...(typeof isActive !== 'undefined' && { isActive }),
      updatedAt: new Date(),
    };

    await db
      .update(ProviderTable)
      .set(updateData)
      .where(eq(ProviderTable.id, id));

    return {
      message: 'Provider updated successfully',
      id,
    };
  }
}

export class ServiceProviderMappingService {
  static async create(payload) {
    let {
      ServiceId,
      ProviderId,
      mode,
      pricingValueType,
      providerCost,
      commissionStartLevel,
      applyTDS = false,
      tdsPercent,
      applyGST = false,
      gstPercent,
      supportsSlab = false,
      config,
      isActive = true,
      slabs = [],
    } = payload;

    // Check if Commission Start Level is "none"
    const isCommissionStartLevelNone = commissionStartLevel === 'NONE';

    if (isCommissionStartLevelNone) {
      // Only validate and process ServiceId, ProviderId, commissionStartLevel, and isActive
      // All other fields should be set to default/null values

      // Validate required fields for "none" scenario
      if (!ServiceId) {
        throw ApiError.badRequest('Service ID is required');
      }
      if (!ProviderId) {
        throw ApiError.badRequest('Provider ID is required');
      }
      if (!commissionStartLevel) {
        throw ApiError.badRequest('Commission start level is required');
      }
      if (!config || typeof config !== 'object') {
        throw ApiError.badRequest('Config must be a valid object');
      }
      if (isActive === undefined || isActive === null) {
        throw ApiError.badRequest('Status is required');
      }

      // Check if service exists
      const [serviceExists] = await db
        .select({ id: ServiceTable.id })
        .from(ServiceTable)
        .where(eq(ServiceTable.id, ServiceId))
        .limit(1);

      if (!serviceExists) {
        throw ApiError.notFound('Service not found');
      }

      // Check if provider exists
      const [providerExists] = await db
        .select({ id: ProviderTable.id })
        .from(ProviderTable)
        .where(eq(ProviderTable.id, ProviderId))
        .limit(1);

      if (!providerExists) {
        throw ApiError.notFound('Provider not found');
      }

      // Check for existing mapping
      const [existingMapping] = await db
        .select({ id: ServiceProviderMappingTable.id })
        .from(ServiceProviderMappingTable)
        .where(
          and(
            eq(ServiceProviderMappingTable.ServiceId, ServiceId),
            eq(ServiceProviderMappingTable.ProviderId, ProviderId),
          ),
        )
        .limit(1);

      if (existingMapping) {
        throw ApiError.conflict(
          'Mapping already exists for this service and provider',
        );
      }

      const id = randomUUID();

      // Insert only the required fields with default values for others
      await db.insert(ServiceProviderMappingTable).values({
        id,
        ServiceId,
        ProviderId,
        commissionStartLevel,
        isActive,
        // Set default values for other fields
        mode: null,
        pricingValueType: null,
        providerCost: BigInt(0),
        applyTDS: false,
        tdsPercent: null,
        applyGST: false,
        gstPercent: null,
        supportsSlab: false,
        config: config || {},
      });

      return {
        id,
        ServiceId,
        ProviderId,
        mode: null,
        pricingValueType: null,
        providerCost: 0,
        commissionStartLevel,
        applyTDS: false,
        tdsPercent: null,
        applyGST: false,
        gstPercent: null,
        supportsSlab: false,
        config: config || {},
        isActive,
        slabs: [],
      };
    }

    if (!config || typeof config !== 'object') {
      throw ApiError.badRequest('Config must be a valid object');
    }

    // Validate required fields for full scenario
    if (!ServiceId) {
      throw ApiError.badRequest('Service ID is required');
    }
    if (!ProviderId) {
      throw ApiError.badRequest('Provider ID is required');
    }
    if (!commissionStartLevel) {
      throw ApiError.badRequest('Commission start level is required');
    }
    if (isActive === undefined || isActive === null) {
      throw ApiError.badRequest('Status is required');
    }
    if (!mode) {
      throw ApiError.badRequest('Mode is required');
    }
    if (!pricingValueType) {
      throw ApiError.badRequest('Pricing value type is required');
    }

    const [serviceExists] = await db
      .select({ id: ServiceTable.id })
      .from(ServiceTable)
      .where(eq(ServiceTable.id, ServiceId))
      .limit(1);

    if (!serviceExists) {
      throw ApiError.notFound('Service not found');
    }

    const [providerExists] = await db
      .select({ id: ProviderTable.id })
      .from(ProviderTable)
      .where(eq(ProviderTable.id, ProviderId))
      .limit(1);

    if (!providerExists) {
      throw ApiError.notFound('Provider not found');
    }

    const [existingMapping] = await db
      .select({ id: ServiceProviderMappingTable.id })
      .from(ServiceProviderMappingTable)
      .where(
        and(
          eq(ServiceProviderMappingTable.ServiceId, ServiceId),
          eq(ServiceProviderMappingTable.ProviderId, ProviderId),
        ),
      )
      .limit(1);

    if (existingMapping) {
      throw ApiError.conflict(
        'Mapping already exists for this service and provider',
      );
    }

    // Validate conditional fields based on mode and settings
    const isCommissionMode = mode === 'COMMISSION';
    const isSurchargeMode = mode === 'SURCHARGE';

    if (isCommissionMode) {
      // Validate provider cost if slab is not supported
      if (!supportsSlab) {
        if (
          providerCost === undefined ||
          providerCost === null ||
          providerCost === ''
        ) {
          throw ApiError.badRequest(
            'Provider cost is required when slab is not supported',
          );
        }
        if (Number(providerCost) < 0) {
          throw ApiError.badRequest('Provider cost must be a positive number');
        }
      }

      // Validate TDS
      if (applyTDS) {
        if (!tdsPercent || Number(tdsPercent) < 0 || Number(tdsPercent) > 100) {
          throw ApiError.badRequest('TDS percent must be between 0 and 100');
        }
      }
    }

    if (isSurchargeMode) {
      // Validate GST
      if (applyGST) {
        if (!gstPercent || Number(gstPercent) < 0 || Number(gstPercent) > 100) {
          throw ApiError.badRequest('GST percent must be between 0 and 100');
        }
      }
    }

    // Validate slabs if supportsSlab is true
    if (supportsSlab) {
      if (!slabs || !Array.isArray(slabs) || slabs.length === 0) {
        throw ApiError.badRequest(
          'Slabs are required when supportsSlab is true',
        );
      }

      // Validate each slab
      for (const slab of slabs) {
        if (!slab.minAmount || slab.minAmount === undefined) {
          throw ApiError.badRequest('Each slab must have minAmount');
        }
        if (!slab.maxAmount || slab.maxAmount === undefined) {
          throw ApiError.badRequest('Each slab must have maxAmount');
        }
        if (!slab.providerCost || slab.providerCost === undefined) {
          throw ApiError.badRequest('Each slab must have providerCost');
        }

        if (Number(slab.minAmount) < 0) {
          throw ApiError.badRequest('minAmount must be a positive number');
        }
        if (Number(slab.maxAmount) <= Number(slab.minAmount)) {
          throw ApiError.badRequest(
            'maxAmount must be greater than minAmount for each slab',
          );
        }
        if (Number(slab.providerCost) < 0) {
          throw ApiError.badRequest('providerCost must be a positive number');
        }
      }

      // Check for overlapping slabs
      const sortedSlabs = [...slabs].sort((a, b) => a.minAmount - b.minAmount);
      for (let i = 0; i < sortedSlabs.length - 1; i++) {
        if (sortedSlabs[i].maxAmount >= sortedSlabs[i + 1].minAmount) {
          throw ApiError.badRequest(
            "Slabs cannot overlap. Each slab's maxAmount must be less than the next slab's minAmount",
          );
        }
      }
    }

    // Convert amounts from rupees to paise
    const providerCostPaise =
      providerCost && providerCost !== ''
        ? rupeesToPaise(providerCost)
        : BigInt(0);

    // Convert percentage values if they exist
    const tdsPercentPaise =
      tdsPercent && tdsPercent !== '' ? rupeesToPaise(tdsPercent) : null;
    const gstPercentPaise =
      gstPercent && gstPercent !== '' ? rupeesToPaise(gstPercent) : null;

    const id = randomUUID();

    // Use transaction to create mapping and slabs
    return await db.transaction(async (tx) => {
      // Insert mapping
      await tx.insert(ServiceProviderMappingTable).values({
        id,
        ServiceId,
        ProviderId,
        mode,
        pricingValueType,
        providerCost: providerCostPaise,
        commissionStartLevel,
        applyTDS,
        tdsPercent: tdsPercentPaise,
        applyGST,
        gstPercent: gstPercentPaise,
        supportsSlab,
        config,
        isActive,
      });

      // Insert slabs if supportsSlab is true
      let createdSlabs = [];
      if (supportsSlab && slabs && slabs.length > 0) {
        const slabValues = slabs.map((slab) => ({
          id: randomUUID(),
          serviceProviderMappingId: id,
          minAmount: rupeesToPaise(slab.minAmount),
          maxAmount: rupeesToPaise(slab.maxAmount),
          providerCost: rupeesToPaise(slab.providerCost),
          isActive: slab.isActive !== undefined ? slab.isActive : true,
        }));

        await tx.insert(ProviderSlabTable).values(slabValues);

        // Convert slabs back to rupees for response
        createdSlabs = slabValues.map((slab) => ({
          id: slab.id,
          minAmount: paiseToRupees(slab.minAmount),
          maxAmount: paiseToRupees(slab.maxAmount),
          providerCost: paiseToRupees(slab.providerCost),
          isActive: slab.isActive,
        }));
      }

      return {
        id,
        ServiceId,
        ProviderId,
        mode,
        pricingValueType,
        providerCost: paiseToRupees(providerCostPaise),
        commissionStartLevel,
        applyTDS,
        tdsPercent: tdsPercentPaise ? paiseToRupees(tdsPercentPaise) : null,
        applyGST,
        gstPercent: gstPercentPaise ? paiseToRupees(gstPercentPaise) : null,
        supportsSlab,
        config,
        isActive,
        slabs: createdSlabs,
      };
    });
  }

  static async getAll(filters = {}) {
    const {
      search,
      serviceId,
      providerId,
      mode,
      isActive,
      limit = 20,
      page = 1,
    } = filters;

    const safeLimit = Math.min(Number(limit) || 20, 100);
    const safePage = Number(page) || 1;
    const offset = (safePage - 1) * safeLimit;

    const conditions = [];

    // Only add search condition if search is provided and not empty
    if (search && search.trim() !== '') {
      const searchValue = `%${search}%`;
      conditions.push(
        sql`(${ServiceTable.name} LIKE ${searchValue} OR 
        ${ServiceTable.code} LIKE ${searchValue} OR
        ${ProviderTable.providerName} LIKE ${searchValue} OR
        ${ProviderTable.code} LIKE ${searchValue})`,
      );
    }

    // Only add serviceId filter if it's provided and not empty
    if (serviceId && serviceId.trim() !== '') {
      conditions.push(eq(ServiceProviderMappingTable.ServiceId, serviceId));
    }

    // Only add providerId filter if it's provided and not empty
    if (providerId && providerId.trim() !== '') {
      conditions.push(eq(ServiceProviderMappingTable.ProviderId, providerId));
    }

    // Only add mode filter if it's provided and not empty
    if (mode && mode.trim() !== '') {
      conditions.push(eq(ServiceProviderMappingTable.mode, mode));
    }

    // Only add isActive filter if it's provided (can be boolean or string)
    if (isActive !== undefined && isActive !== null && isActive !== '') {
      const activeValue = isActive === 'true' || isActive === true;
      conditions.push(eq(ServiceProviderMappingTable.isActive, activeValue));
    }

    // Build the query
    let query = db
      .select({
        id: ServiceProviderMappingTable.id,
        ServiceId: ServiceProviderMappingTable.ServiceId,
        ProviderId: ServiceProviderMappingTable.ProviderId,
        mode: ServiceProviderMappingTable.mode,
        pricingValueType: ServiceProviderMappingTable.pricingValueType,
        providerCost: ServiceProviderMappingTable.providerCost,
        commissionStartLevel: ServiceProviderMappingTable.commissionStartLevel,
        applyTDS: ServiceProviderMappingTable.applyTDS,
        tdsPercent: ServiceProviderMappingTable.tdsPercent,
        applyGST: ServiceProviderMappingTable.applyGST,
        gstPercent: ServiceProviderMappingTable.gstPercent,
        supportsSlab: ServiceProviderMappingTable.supportsSlab,
        config: ServiceProviderMappingTable.config,
        isActive: ServiceProviderMappingTable.isActive,
        createdAt: ServiceProviderMappingTable.createdAt,
        updatedAt: ServiceProviderMappingTable.updatedAt,
        serviceName: ServiceTable.name,
        serviceCode: ServiceTable.code,
        providerName: ProviderTable.providerName,
        providerCode: ProviderTable.code,
        // Slab fields
        slabId: ProviderSlabTable.id,
        slabMinAmount: ProviderSlabTable.minAmount,
        slabMaxAmount: ProviderSlabTable.maxAmount,
        slabProviderCost: ProviderSlabTable.providerCost,
        slabIsActive: ProviderSlabTable.isActive,
        slabCreatedAt: ProviderSlabTable.createdAt,
        slabUpdatedAt: ProviderSlabTable.updatedAt,
      })
      .from(ServiceProviderMappingTable)
      .leftJoin(
        ServiceTable,
        eq(ServiceTable.id, ServiceProviderMappingTable.ServiceId),
      )
      .leftJoin(
        ProviderTable,
        eq(ProviderTable.id, ServiceProviderMappingTable.ProviderId),
      )
      .leftJoin(
        ProviderSlabTable,
        eq(
          ProviderSlabTable.serviceProviderMappingId,
          ServiceProviderMappingTable.id,
        ),
      );

    // Apply where conditions if any
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply ordering and pagination
    const data = await query
      .orderBy(desc(ServiceProviderMappingTable.createdAt))
      .limit(safeLimit)
      .offset(offset);

    // Group the data by mapping ID and collect slabs
    const mappingMap = new Map();

    data.forEach((row) => {
      const mappingId = row.id;

      if (!mappingMap.has(mappingId)) {
        // Create a new mapping entry without slab data
        mappingMap.set(mappingId, {
          id: row.id,
          ServiceId: row.ServiceId,
          ProviderId: row.ProviderId,
          mode: row.mode,
          pricingValueType: row.pricingValueType,
          providerCost: paiseToRupees(row.providerCost),
          commissionStartLevel: row.commissionStartLevel,
          applyTDS: row.applyTDS,
          tdsPercent: row.tdsPercent ? paiseToRupees(row.tdsPercent) : null,
          applyGST: row.applyGST,
          gstPercent: row.gstPercent ? paiseToRupees(row.gstPercent) : null,
          supportsSlab: row.supportsSlab,
          config: row.config,
          isActive: row.isActive,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          serviceName: row.serviceName,
          serviceCode: row.serviceCode,
          providerName: row.providerName,
          providerCode: row.providerCode,
          slabs: [], // Initialize empty slabs array
        });
      }

      // If slab exists, add it to the mapping's slabs array
      if (row.slabId) {
        const mapping = mappingMap.get(mappingId);
        mapping.slabs.push({
          id: row.slabId,
          minAmount: paiseToRupees(row.slabMinAmount),
          maxAmount: paiseToRupees(row.slabMaxAmount),
          providerCost: paiseToRupees(row.slabProviderCost),
          isActive: row.slabIsActive,
          createdAt: row.slabCreatedAt,
          updatedAt: row.slabUpdatedAt,
        });
      }
    });

    // Sort slabs by minAmount for each mapping
    const convertedData = Array.from(mappingMap.values()).map((mapping) => ({
      ...mapping,
      slabs: mapping.slabs.sort((a, b) => a.minAmount - b.minAmount),
    }));

    // Get total count
    let countQuery = db
      .select({
        total: sql`COUNT(*)`.mapWith(Number),
      })
      .from(ServiceProviderMappingTable)
      .leftJoin(
        ServiceTable,
        eq(ServiceTable.id, ServiceProviderMappingTable.ServiceId),
      )
      .leftJoin(
        ProviderTable,
        eq(ProviderTable.id, ServiceProviderMappingTable.ProviderId),
      );

    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }

    const [{ total }] = await countQuery;

    return {
      data: convertedData,
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  static async getAllowedMappings(actor, filters = {}) {
    const { enabledServices } = await resolvePermissions(actor);

    const { search, serviceId, providerId, mode, isActive } = filters;

    const conditions = [];

    if (!enabledServices || enabledServices.length === 0) {
      return { data: [] };
    }

    const isSuperAdmin = enabledServices.includes('*');

    if (!isSuperAdmin) {
      conditions.push(
        sql`${ServiceTable.code} IN (${sql.join(
          enabledServices.map((s) => sql`${s}`),
          sql`, `,
        )})`,
      );
    }

    if (search && search.trim() !== '') {
      const searchValue = `%${search}%`;
      conditions.push(
        sql`(
        ${ServiceTable.name} LIKE ${searchValue}
        OR ${ServiceTable.code} LIKE ${searchValue}
        OR ${ProviderTable.providerName} LIKE ${searchValue}
        OR ${ProviderTable.code} LIKE ${searchValue}
      )`,
      );
    }

    if (serviceId) {
      conditions.push(eq(ServiceProviderMappingTable.ServiceId, serviceId));
    }

    if (providerId) {
      conditions.push(eq(ServiceProviderMappingTable.ProviderId, providerId));
    }

    if (mode) {
      conditions.push(eq(ServiceProviderMappingTable.mode, mode));
    }

    if (isActive !== undefined && isActive !== null) {
      const activeValue = isActive === 'true' || isActive === true;
      conditions.push(eq(ServiceProviderMappingTable.isActive, activeValue));
    }

    const mappings = await db
      .select({
        id: ServiceProviderMappingTable.id,
        serviceCode: ServiceTable.code,
        providerCode: ProviderTable.code,
        providerCost: ServiceProviderMappingTable.providerCost,
        pricingValueType: ServiceProviderMappingTable.pricingValueType,
        mode: ServiceProviderMappingTable.mode,
        supportsSlab: ServiceProviderMappingTable.supportsSlab,

        applyTDS: ServiceProviderMappingTable.applyTDS,
        tdsPercent: ServiceProviderMappingTable.tdsPercent,
        applyGST: ServiceProviderMappingTable.applyGST,
        gstPercent: ServiceProviderMappingTable.gstPercent,
      })
      .from(ServiceProviderMappingTable)
      .leftJoin(
        ServiceTable,
        eq(ServiceTable.id, ServiceProviderMappingTable.ServiceId),
      )
      .leftJoin(
        ProviderTable,
        eq(ProviderTable.id, ServiceProviderMappingTable.ProviderId),
      )
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const mappingIds = mappings.map((m) => m.id);

    let slabsMap = new Map();

    if (mappingIds.length > 0) {
      const slabs = await db
        .select({
          mappingId: ProviderSlabTable.serviceProviderMappingId,
          minAmount: ProviderSlabTable.minAmount,
          maxAmount: ProviderSlabTable.maxAmount,
          providerCost: ProviderSlabTable.providerCost,
        })
        .from(ProviderSlabTable)
        .where(
          sql`${ProviderSlabTable.serviceProviderMappingId} IN (${sql.join(
            mappingIds.map((id) => sql`${id}`),
            sql`, `,
          )})`,
        );

      slabs.forEach((s) => {
        if (!slabsMap.has(s.mappingId)) {
          slabsMap.set(s.mappingId, []);
        }

        slabsMap.get(s.mappingId).push({
          minAmount: paiseToRupees(s.minAmount),
          maxAmount: paiseToRupees(s.maxAmount),
          providerCost: paiseToRupees(s.providerCost),
        });
      });
    }

    const finalData = mappings.map((m) => ({
      id: m.id,
      serviceCode: m.serviceCode,
      providerCode: m.providerCode,
      providerCost: paiseToRupees(m.providerCost),
      pricingValueType: m.pricingValueType,
      mode: m.mode,
      supportsSlab: m.supportsSlab,

      applyTDS: m.applyTDS,
      tdsPercent: m.tdsPercent ? paiseToRupees(m.tdsPercent) : null,
      applyGST: m.applyGST,
      gstPercent: m.gstPercent ? paiseToRupees(m.gstPercent) : null,

      slabs: m.supportsSlab ? slabsMap.get(m.id) || [] : [],
    }));

    return {
      data: finalData,
    };
  }

  static async update(id, payload) {
    const {
      ServiceId,
      ProviderId,
      mode,
      pricingValueType,
      providerCost,
      commissionStartLevel,
      applyTDS,
      tdsPercent,
      applyGST,
      gstPercent,
      supportsSlab,
      config,
      isActive,
      slabs, // New field for slabs
    } = payload;

    const [existing] = await db
      .select({
        id: ServiceProviderMappingTable.id,
        ServiceId: ServiceProviderMappingTable.ServiceId,
        ProviderId: ServiceProviderMappingTable.ProviderId,
        supportsSlab: ServiceProviderMappingTable.supportsSlab,
      })
      .from(ServiceProviderMappingTable)
      .where(eq(ServiceProviderMappingTable.id, id))
      .limit(1);

    if (!existing) {
      throw ApiError.notFound('Service provider mapping not found');
    }

    if (config !== undefined && typeof config !== 'object') {
      throw ApiError.badRequest('Config must be a valid object');
    }

    if (ServiceId || ProviderId) {
      const finalServiceId = ServiceId || existing.ServiceId;
      const finalProviderId = ProviderId || existing.ProviderId;

      if (ServiceId && ServiceId !== existing.ServiceId) {
        const [serviceExists] = await db
          .select({ id: ServiceTable.id })
          .from(ServiceTable)
          .where(eq(ServiceTable.id, ServiceId))
          .limit(1);

        if (!serviceExists) {
          throw ApiError.notFound('Service not found');
        }
      }

      if (ProviderId && ProviderId !== existing.ProviderId) {
        const [providerExists] = await db
          .select({ id: ProviderTable.id })
          .from(ProviderTable)
          .where(eq(ProviderTable.id, ProviderId))
          .limit(1);

        if (!providerExists) {
          throw ApiError.notFound('Provider not found');
        }
      }

      if (
        (ServiceId && ServiceId !== existing.ServiceId) ||
        (ProviderId && ProviderId !== existing.ProviderId)
      ) {
        const [duplicate] = await db
          .select({ id: ServiceProviderMappingTable.id })
          .from(ServiceProviderMappingTable)
          .where(
            and(
              eq(ServiceProviderMappingTable.ServiceId, finalServiceId),
              eq(ServiceProviderMappingTable.ProviderId, finalProviderId),
              sql`${ServiceProviderMappingTable.id} != ${id}`,
            ),
          )
          .limit(1);

        if (duplicate) {
          throw ApiError.conflict(
            'Mapping already exists for this service and provider',
          );
        }
      }
    }

    if (
      applyTDS === true &&
      (!tdsPercent || Number(tdsPercent) < 0 || Number(tdsPercent) > 100)
    ) {
      throw ApiError.badRequest('TDS percent must be between 0 and 100');
    }

    if (
      applyGST === true &&
      (!gstPercent || Number(gstPercent) < 0 || Number(gstPercent) > 100)
    ) {
      throw ApiError.badRequest('GST percent must be between 0 and 100');
    }

    if (providerCost !== undefined && Number(providerCost) < 0) {
      throw ApiError.badRequest('Provider cost must be a positive number');
    }

    // Validate slabs if supportsSlab is being set to true
    const finalSupportsSlab =
      supportsSlab !== undefined ? supportsSlab : existing.supportsSlab;

    if (finalSupportsSlab && slabs !== undefined) {
      if (!Array.isArray(slabs)) {
        throw ApiError.badRequest('Slabs must be an array');
      }

      // Validate each slab
      for (const slab of slabs) {
        if (slab.minAmount === undefined) {
          throw ApiError.badRequest('Each slab must have minAmount');
        }
        if (slab.maxAmount === undefined) {
          throw ApiError.badRequest('Each slab must have maxAmount');
        }
        if (slab.providerCost === undefined) {
          throw ApiError.badRequest('Each slab must have providerCost');
        }

        if (Number(slab.minAmount) < 0) {
          throw ApiError.badRequest('minAmount must be a positive number');
        }
        if (Number(slab.maxAmount) <= Number(slab.minAmount)) {
          throw ApiError.badRequest(
            'maxAmount must be greater than minAmount for each slab',
          );
        }
        if (Number(slab.providerCost) < 0) {
          throw ApiError.badRequest('providerCost must be a positive number');
        }
      }

      // Check for overlapping slabs
      const sortedSlabs = [...slabs].sort((a, b) => a.minAmount - b.minAmount);
      for (let i = 0; i < sortedSlabs.length - 1; i++) {
        if (sortedSlabs[i].maxAmount >= sortedSlabs[i + 1].minAmount) {
          throw ApiError.badRequest(
            "Slabs cannot overlap. Each slab's maxAmount must be less than the next slab's minAmount",
          );
        }
      }
    }

    const updateData = {
      ...(ServiceId && { ServiceId }),
      ...(ProviderId && { ProviderId }),
      ...(mode && { mode }),
      ...(pricingValueType && { pricingValueType }),
      ...(providerCost !== undefined && {
        providerCost: rupeesToPaise(providerCost),
      }),
      ...(commissionStartLevel && { commissionStartLevel }),
      ...(typeof applyTDS !== 'undefined' && { applyTDS }),
      ...(tdsPercent !== undefined && {
        tdsPercent: tdsPercent ? rupeesToPaise(tdsPercent) : null,
      }),
      ...(typeof applyGST !== 'undefined' && { applyGST }),
      ...(gstPercent !== undefined && {
        gstPercent: gstPercent ? rupeesToPaise(gstPercent) : null,
      }),
      ...(typeof supportsSlab !== 'undefined' && { supportsSlab }),
      ...(config !== undefined && { config }),
      ...(typeof isActive !== 'undefined' && { isActive }),
      updatedAt: new Date(),
    };

    return await db.transaction(async (tx) => {
      // Update mapping
      await tx
        .update(ServiceProviderMappingTable)
        .set(updateData)
        .where(eq(ServiceProviderMappingTable.id, id));

      // Handle slabs update if slabs array is provided
      let updatedSlabs = [];
      if (slabs !== undefined) {
        // Delete existing slabs
        await tx
          .delete(ProviderSlabTable)
          .where(eq(ProviderSlabTable.serviceProviderMappingId, id));

        // Insert new slabs if supportsSlab is true
        if (finalSupportsSlab && slabs.length > 0) {
          const slabValues = slabs.map((slab) => ({
            id: slab.id || randomUUID(),
            serviceProviderMappingId: id,
            minAmount: rupeesToPaise(slab.minAmount),
            maxAmount: rupeesToPaise(slab.maxAmount),
            providerCost: rupeesToPaise(slab.providerCost),
            isActive: slab.isActive !== undefined ? slab.isActive : true,
          }));

          await tx.insert(ProviderSlabTable).values(slabValues);

          // Convert slabs back to rupees for response
          updatedSlabs = slabValues.map((slab) => ({
            id: slab.id,
            minAmount: paiseToRupees(slab.minAmount),
            maxAmount: paiseToRupees(slab.maxAmount),
            providerCost: paiseToRupees(slab.providerCost),
            isActive: slab.isActive,
          }));
        }
      }

      return {
        message: 'Service provider mapping updated successfully',
        id,
        slabs: updatedSlabs,
      };
    });
  }

  static async hardDelete(id) {
    return await db.transaction(async (tx) => {
      // Check if mapping exists
      const [existing] = await tx
        .select({
          id: ServiceProviderMappingTable.id,
          supportsSlab: ServiceProviderMappingTable.supportsSlab,
        })
        .from(ServiceProviderMappingTable)
        .where(eq(ServiceProviderMappingTable.id, id))
        .limit(1);

      if (!existing) {
        throw ApiError.notFound('Service provider mapping not found');
      }

      // Check for associated slabs
      const [slabCount] = await tx
        .select({
          count: sql`COUNT(*)`.mapWith(Number),
        })
        .from(ProviderSlabTable)
        .where(eq(ProviderSlabTable.serviceProviderMappingId, id));

      // Delete associated slabs first if they exist
      if (slabCount.count > 0) {
        await tx
          .delete(ProviderSlabTable)
          .where(eq(ProviderSlabTable.serviceProviderMappingId, id));
      }

      // Now delete the mapping
      await tx
        .delete(ServiceProviderMappingTable)
        .where(eq(ServiceProviderMappingTable.id, id));

      return {
        message:
          slabCount.count > 0
            ? `Service provider mapping and ${slabCount.count} associated slab(s) permanently deleted`
            : 'Service provider mapping permanently deleted',
        id,
        deletedSlabsCount: slabCount.count,
      };
    });
  }
}
