import { and, eq } from 'drizzle-orm';
import crypto from 'node:crypto';

import {
  tenantsDomainsTable,
  tenantsTable,
  usersTable,
  employeesTable,
  serverDetailTable,
  smtpConfigTable,
} from '../models/core/index.js';
import { db } from '../database/core/core-db.js';
import { ApiError } from '../lib/ApiError.js';
import { EVENTS } from '../events/events.constants.js';
import { eventBus } from '../events/events.js';

class TenantDomainService {
  static async upsert(payload, actor) {
    if (!actor) {
      throw ApiError.unauthorized('Invalid actor');
    }

    const tenantId = payload?.tenantId ?? actor?.tenantId;
    if (!tenantId) {
      throw ApiError.badRequest('TenantId missing');
    }

    const domainName = payload.domainName?.trim().toLowerCase();

    const domainRegex =
      /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)\.(?:[A-Za-z]{2,6}|[A-Za-z0-9-]{2,30}\.[A-Za-z]{2,3})$/;
    if (!domainRegex.test(domainName)) {
      throw ApiError.badRequest('Invalid domain name format');
    }

    const [serverDetail] = await db
      .select({ id: serverDetailTable.id })
      .from(serverDetailTable)
      .where(eq(serverDetailTable.tenantId, actor.tenantId))
      .limit(1);

    if (!serverDetail) {
      throw ApiError.badRequest('Server detail must be configured first');
    }

    const [smtp] = await db
      .select({ id: smtpConfigTable.id })
      .from(smtpConfigTable)
      .where(eq(smtpConfigTable.tenantId, actor.tenantId))
      .limit(1);

    if (!smtp) {
      throw ApiError.badRequest('SMTP must be configured first');
    }

    const now = new Date();

    const [existing] = await db
      .select()
      .from(tenantsDomainsTable)
      .where(
        and(
          eq(tenantsDomainsTable.tenantId, tenantId),
          eq(tenantsDomainsTable.domainName, domainName),
        ),
      )
      .limit(1);

    /* ================= UPDATE CASE ================= */
    if (existing) {
      const updatePayload = {
        status: payload.status ?? existing.status,
        updatedAt: now,
      };

      if (payload.serverDetailId) {
        updatePayload.serverDetailId = payload.serverDetailId;
      }

      await db
        .update(tenantsDomainsTable)
        .set(updatePayload)
        .where(eq(tenantsDomainsTable.id, existing.id));

      return { id: existing.id, updated: true };
    }

    /* ================= INSERT CASE ================= */
    const server = await resolveServerForTenant(tenantId);

    const id = crypto.randomUUID();

    let existingTenant = null;
    if (payload.tenantId) {
      const [tenant] = await db
        .select({ email: tenantsTable.tenantEmail })
        .from(tenantsTable)
        .where(eq(tenantsTable.id, payload.tenantId))
        .limit(1);

      existingTenant = tenant;
    }

    if (!existingTenant?.email) {
      throw ApiError.badRequest('Tenant email not found');
    }

    const sent = eventBus.emit(EVENTS.DOMAIN_CREATE, {
      domainId: id,
      email: existingTenant.email,
      tenantId: actor.tenantId,
    });

    if (!sent) {
      throw ApiError.internal('Failed to send domain create event');
    }
    await db.insert(tenantsDomainsTable).values({
      id,
      tenantId,
      domainName,
      serverDetailId: payload.serverDetailId ?? server.id,
      status: payload.status || 'PENDING',
      createdByUserId: actor.type === 'USER' ? actor.id : null,
      createdByEmployeeId: actor.type === 'EMPLOYEE' ? actor.id : null,
      createdAt: now,
      updatedAt: now,
    });

    return { id, created: true };
  }

  static async findByTenantId(tenantId) {
    const [result] = await db
      .select({
        domain: tenantsDomainsTable,
        userNumber: usersTable.userNumber,
        employeeNumber: employeesTable.employeeNumber,
        tenantNumber: tenantsTable.tenantNumber,
      })
      .from(tenantsDomainsTable)
      .leftJoin(tenantsTable, eq(tenantsTable.id, tenantsDomainsTable.tenantId))
      .leftJoin(
        usersTable,
        eq(usersTable.id, tenantsDomainsTable.createdByUserId),
      )
      .leftJoin(
        employeesTable,
        eq(employeesTable.id, tenantsDomainsTable.createdByEmployeeId),
      )
      .where(eq(tenantsDomainsTable.tenantId, tenantId))
      .limit(1);

    return result
      ? {
          ...result.domain,
          createdBy: result.userNumber
            ? { type: 'USER', userNumber: result.userNumber }
            : result.employeeNumber
              ? { type: 'EMPLOYEE', employeeNumber: result.employeeNumber }
              : null,
          tenantNumber: result.tenantNumber,
        }
      : null;
  }
}
async function resolveServerForTenant(tenantId) {
  // 1️⃣ own server
  const [server] = await db
    .select()
    .from(serverDetailTable)
    .where(eq(serverDetailTable.tenantId, tenantId))
    .limit(1);

  if (server) return server;

  // 2️⃣ parent fallback
  const [tenant] = await db
    .select({ parentTenantId: tenantsTable.parentTenantId })
    .from(tenantsTable)
    .where(eq(tenantsTable.id, tenantId))
    .limit(1);

  if (!tenant?.parentTenantId) {
    throw ApiError.notFound('No server available for tenant');
  }

  return resolveServerForTenant(tenant.parentTenantId);
}

export { TenantDomainService };
