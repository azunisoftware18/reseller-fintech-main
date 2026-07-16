import { and, count, desc, eq, like, or } from 'drizzle-orm';
import { employeesTable, tenantsTable } from '../models/core/index.js';
import { ApiError } from '../lib/ApiError.js';
import { db } from '../database/core/core-db.js';
import { generateNumber, generatePrefix } from '../lib/lib.js';

class TenantService {
  static async create(payload, actor) {
    // 1️⃣ Actor tenant
    const [currentTenant] = await db
      .select({
        id: tenantsTable.id,
        parentTenantId: tenantsTable.parentTenantId,
        userType: tenantsTable.userType,
      })
      .from(tenantsTable)
      .where(eq(tenantsTable.id, actor.tenantId))
      .limit(1);

    if (!currentTenant) {
      throw ApiError.notFound('Actor tenant not found');
    }

    // 2️⃣ Hierarchy enforcement
    const allowedChildMap = {
      AZZUNIQUE: ['RESELLER'],
      RESELLER: ['WHITELABEL'],
      WHITELABEL: [],
    };

    if (!allowedChildMap[currentTenant.userType]?.includes(payload.userType)) {
      throw ApiError.forbidden(
        `You cannot create ${payload.userType} under ${currentTenant.userType}`,
      );
    }

    // 3️⃣ AZZUNIQUE singleton
    if (payload.userType === 'AZZUNIQUE') {
      const [azz] = await db
        .select({ id: tenantsTable.id })
        .from(tenantsTable)
        .where(eq(tenantsTable.userType, 'AZZUNIQUE'))
        .limit(1);

      if (azz) {
        throw ApiError.conflict('There can be only one AZZUNIQUE tenant');
      }
    }

    const parentTenantId = currentTenant.id;

    // 4️⃣ Duplicate tenant check
    const [existing] = await db
      .select({ id: tenantsTable.id })
      .from(tenantsTable)
      .where(
        and(
          eq(tenantsTable.parentTenantId, parentTenantId),
          or(
            eq(tenantsTable.tenantEmail, payload.tenantEmail),
            eq(tenantsTable.tenantMobileNumber, payload.tenantMobileNumber),
            eq(tenantsTable.tenantWhatsapp, payload.tenantWhatsapp),
          ),
        ),
      )
      .limit(1);

    if (existing) {
      throw ApiError.conflict('Tenant already exists under this parent');
    }

    const tenantPrefix = generatePrefix('TNT');

    // 5️⃣ Insert tenant
    await db.insert(tenantsTable).values({
      ...payload,
      tenantNumber: generateNumber(tenantPrefix),
      parentTenantId,
      createdByUserId: actor.type === 'USER' ? actor.id : null,
      createdByEmployeeId: actor.type === 'EMPLOYEE' ? actor.id : null,
      actionedAt: ['INACTIVE', 'SUSPENDED', 'DELETED'].includes(
        payload.tenantStatus,
      )
        ? new Date()
        : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const [created] = await db
      .select()
      .from(tenantsTable)
      .where(
        and(
          eq(tenantsTable.tenantEmail, payload.tenantEmail),
          eq(tenantsTable.parentTenantId, parentTenantId),
        ),
      )
      .limit(1);

    return created;
  }

  static async findAll(actor, query = {}) {
    let { search = '', status = 'all', limit = 20, page = 1 } = query;
    limit = Number(limit);
    page = Number(page);
    const offset = (page - 1) * limit;

    const conditions = [eq(tenantsTable.parentTenantId, actor.tenantId)];

    if (search) {
      conditions.push(
        or(
          like(tenantsTable.tenantNumber, `%${search}%`),
          like(tenantsTable.tenantName, `%${search}%`),
        ),
      );
    }

    if (status !== 'all') {
      conditions.push(eq(tenantsTable.tenantStatus, status));
    }

    const data = await db
      .select()
      .from(tenantsTable)
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(tenantsTable.createdAt));

    const [{ total }] = await db
      .select({ total: count() })
      .from(tenantsTable)
      .where(and(...conditions));

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async findOne(id, actor) {
    const [row] = await db
      .select({
        tenant: tenantsTable,
        employeeNumber: employeesTable.employeeNumber,
      })
      .from(tenantsTable)
      .leftJoin(
        employeesTable,
        eq(employeesTable.id, tenantsTable.createdByEmployeeId),
      )
      .where(eq(tenantsTable.id, id))
      .limit(1);

    if (!row) {
      throw ApiError.notFound('Tenant not found');
    }

    const isSameTenant = row.tenant.id === actor.tenantId;
    const isDirectChild = row.tenant.parentTenantId === actor.tenantId;
    const isAncestor = actor.isTenantOwner === true;

    if (!isSameTenant && !isDirectChild && !isAncestor) {
      throw ApiError.forbidden('Access denied');
    }

    return {
      ...row.tenant,
      employee: row.employeeNumber
        ? { employeeNumber: row.employeeNumber }
        : null,
    };
  }

  static async update(id, payload, actor) {
    if (!actor.isTenantOwner && actor.type !== 'EMPLOYEE') {
      throw ApiError.forbidden('Access denied');
    }

    const tenant = await this.findOne(id, actor);

    // ❌ Prevent removing last owner
    if (tenant.parentTenantId === null && payload.tenantStatus === 'DELETED') {
      throw ApiError.forbidden('Root tenant cannot be deleted');
    }

    const updates = {};

    for (const key of Object.keys(payload)) {
      if (payload[key] !== tenant[key]) {
        updates[key] = payload[key];
      }
    }

    if (payload.tenantStatus) {
      updates.actionReason =
        payload.tenantStatus === 'ACTIVE' ? null : payload.actionReason;
      updates.actionedAt =
        payload.tenantStatus === 'ACTIVE' ? null : new Date();
    }

    updates.updatedAt = new Date();

    await db.update(tenantsTable).set(updates).where(eq(tenantsTable.id, id));

    return { id, ...updates };
  }

  static async getAllDescendants({ tenantId }, actor, query = {}) {
    const [tenant] = await db
      .select()
      .from(tenantsTable)
      .where(eq(tenantsTable.id, tenantId))
      .limit(1);

    if (!tenant) {
      throw ApiError.notFound('Tenant not found');
    }

    // ✅ Allow self OR ancestor owner OR employee under same tenant tree
    if (
      tenant.id !== actor.tenantId &&
      actor.isTenantOwner !== true &&
      actor.type !== 'EMPLOYEE'
    ) {
      throw ApiError.forbidden('Access denied');
    }

    const children = await db
      .select()
      .from(tenantsTable)
      .where(eq(tenantsTable.parentTenantId, tenantId))
      .orderBy(desc(tenantsTable.createdAt));

    return { tenant, children };
  }
}

export { TenantService };
