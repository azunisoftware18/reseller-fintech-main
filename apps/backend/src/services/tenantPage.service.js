import { db } from '../database/core/core-db.js';
import { and, eq, ne } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ApiError } from '../lib/ApiError.js';
import { tenantsTable, tenantPagesTable } from '../models/core/index.js';

export class TenantPageService {
  // ================= CREATE =================
  static async create(payload, actor) {
    const tenant = await ensureActiveTenant(actor.tenantId);

    await this.ensurePageUrlUnique(actor.tenantId, payload.pageUrl);

    const id = randomUUID();

    await db.insert(tenantPagesTable).values({
      id,
      tenantId: tenant.id,
      pageTitle: payload.pageTitle,
      pageContent: payload.pageContent,
      pageUrl: payload.pageUrl,
      status: payload.status ?? 'DRAFT',
      createdByUserId: actor.type === 'USER' ? actor.id : null,
      createdByEmployeeId: actor.type === 'EMPLOYEE' ? actor.id : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.getById(id, actor);
  }

  // ================= UPDATE =================
  static async update(id, payload, actor) {
    const existing = await this.getById(id, actor);

    const tenant = await ensureActiveTenant(actor.tenantId);

    await this.ensurePageUrlUnique(actor.tenantId, payload.pageUrl);

    // pageUrl change case
    if (payload.pageUrl && payload.pageUrl !== existing.pageUrl) {
      await this.ensurePageUrlUnique(
        actor.tenantId,
        payload.pageUrl,
        id, // exclude self
      );
    }

    await db
      .update(tenantPagesTable)
      .set({
        ...payload,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(tenantPagesTable.id, id),
          eq(tenantPagesTable.tenantId, actor.tenantId),
        ),
      );

    return this.getById(id, actor);
  }

  // ================= DELETE =================
  static async delete(id, actor) {
    await this.getById(id, actor);

    await db
      .update(tenantPagesTable)
      .set({
        status: 'DELETED',
        deletedAt: new Date(),
      })
      .where(
        and(
          eq(tenantPagesTable.id, id),
          eq(tenantPagesTable.tenantId, actor.tenantId),
        ),
      );

    return true;
  }

  // ================= GET BY ID (AUTH) =================
  static async getById(id, actor) {
    const [page] = await db
      .select()
      .from(tenantPagesTable)
      .where(
        and(
          eq(tenantPagesTable.id, id),
          eq(tenantPagesTable.tenantId, actor.tenantId),
        ),
      )
      .limit(1);

    if (!page) {
      throw ApiError.notFound('Page not found');
    }

    return page;
  }

  // ================= PUBLIC GET ALL =================
  static async getAll(tenantId) {
    return db
      .select({
        pageTitle: tenantPagesTable.pageTitle,
        pageContent: tenantPagesTable.pageContent,
        pageUrl: tenantPagesTable.pageUrl,
      })
      .from(tenantPagesTable)
      .where(
        and(
          eq(tenantPagesTable.tenantId, tenantId),
          eq(tenantPagesTable.status, 'PUBLISHED'),
        ),
      );
  }

  static async ensurePageUrlUnique(tenantId, pageUrl, excludeId = null) {
    const where = excludeId
      ? and(
          eq(tenantPagesTable.tenantId, tenantId),
          eq(tenantPagesTable.pageUrl, pageUrl),
          ne(tenantPagesTable.id, excludeId),
        )
      : and(
          eq(tenantPagesTable.tenantId, tenantId),
          eq(tenantPagesTable.pageUrl, pageUrl),
        );

    const [existing] = await db
      .select({ id: tenantPagesTable.id })
      .from(tenantPagesTable)
      .where(where)
      .limit(1);

    if (existing) {
      throw ApiError.conflict(`Page with URL "${pageUrl}" already exists`);
    }
  }

  static async ensureActiveTenant(tenantId) {
    const [tenant] = await db
      .select({
        id: tenantsTable.id,
        tenantStatus: tenantsTable.tenantStatus,
      })
      .from(tenantsTable)
      .where(eq(tenantsTable.id, tenantId))
      .limit(1);

    if (!tenant) {
      throw ApiError.forbidden('Tenant not found');
    }

    if (tenant.tenantStatus !== 'ACTIVE') {
      throw ApiError.forbidden('Tenant is not active');
    }

    return tenant;
  }
}
