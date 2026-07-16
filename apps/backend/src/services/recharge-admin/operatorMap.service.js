import { db } from '../../database/core/core-db.js';
import { ApiError } from '../../lib/ApiError.js';
import crypto from 'crypto';
import { and, eq } from 'drizzle-orm';
import { rechargeOperatorMapTable } from '../../models/core/rechargeOperatorMap.schema.js';
import { ServiceProviderMappingTable } from '../../models/core/serviceProviderMapping.schema.js';
import { ServiceTable } from '../../models/core/service.schema.js';
import { ProviderTable } from '../../models/core/provider.schema.js';

class OperatorMapService {
  async upsert(data, actor) {
    if (actor.roleLevel !== 0) {
      throw ApiError.forbidden('Only AZZUNIQUE allowed');
    }

    const [mapping] = await db
      .select({ id: ServiceProviderMappingTable.id })
      .from(ServiceProviderMappingTable)
      .where(eq(ServiceProviderMappingTable.id, data.serviceProviderMappingId))
      .limit(1);

    if (!mapping) {
      throw ApiError.badRequest('Service-Provider mapping not found');
    }

    const now = new Date();

    // Check existing with direction
    const [existing] = await db
      .select({ id: rechargeOperatorMapTable.id })
      .from(rechargeOperatorMapTable)
      .where(
        and(
          eq(
            rechargeOperatorMapTable.internalOperatorCode,
            data.internalOperatorCode,
          ),
          eq(
            rechargeOperatorMapTable.serviceProviderMappingId,
            data.serviceProviderMappingId,
          ),
          eq(rechargeOperatorMapTable.direction, data.direction),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .update(rechargeOperatorMapTable)
        .set({
          providerOperatorCode: data.providerOperatorCode,
          updatedAt: now,
        })
        .where(eq(rechargeOperatorMapTable.id, existing.id));
    } else {
      await db.insert(rechargeOperatorMapTable).values({
        id: crypto.randomUUID(),
        serviceProviderMappingId: data.serviceProviderMappingId,
        internalOperatorCode: data.internalOperatorCode,
        providerOperatorCode: data.providerOperatorCode,
        direction: data.direction,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { success: true, message: existing ? 'Updated' : 'Created' };
  }

  async getProviderCode(internalCode, serviceProviderMappingId, direction) {
    const [result] = await db
      .select({
        providerOperatorCode: rechargeOperatorMapTable.providerOperatorCode,
      })
      .from(rechargeOperatorMapTable)
      .where(
        and(
          eq(rechargeOperatorMapTable.internalOperatorCode, internalCode),
          eq(
            rechargeOperatorMapTable.serviceProviderMappingId,
            serviceProviderMappingId,
          ),
          eq(rechargeOperatorMapTable.direction, direction),
        ),
      )
      .limit(1);

    return result?.providerOperatorCode || null;
  }

  async getMappingByDirection(
    internalCode,
    serviceProviderMappingId,
    direction,
  ) {
    const [result] = await db
      .select({
        providerOperatorCode: rechargeOperatorMapTable.providerOperatorCode,
        serviceProviderMappingId:
          rechargeOperatorMapTable.serviceProviderMappingId,
      })
      .from(rechargeOperatorMapTable)
      .where(
        and(
          eq(rechargeOperatorMapTable.internalOperatorCode, internalCode),
          eq(
            rechargeOperatorMapTable.serviceProviderMappingId,
            serviceProviderMappingId,
          ),
          eq(rechargeOperatorMapTable.direction, direction),
        ),
      )
      .limit(1);

    return result || null;
  }

  async list(filters = {}) {
    let conditions = [];

    if (filters.direction) {
      conditions.push(
        eq(rechargeOperatorMapTable.direction, filters.direction),
      );
    }
    if (filters.serviceProviderMappingId) {
      conditions.push(
        eq(
          rechargeOperatorMapTable.serviceProviderMappingId,
          filters.serviceProviderMappingId,
        ),
      );
    }

    let query = db
      .select({
        id: rechargeOperatorMapTable.id,
        internalOperatorCode: rechargeOperatorMapTable.internalOperatorCode,
        providerOperatorCode: rechargeOperatorMapTable.providerOperatorCode,
        direction: rechargeOperatorMapTable.direction,
        serviceProviderMappingId:
          rechargeOperatorMapTable.serviceProviderMappingId,
        serviceName: ServiceTable.name,
        providerName: ProviderTable.providerName,
        createdAt: rechargeOperatorMapTable.createdAt,
        updatedAt: rechargeOperatorMapTable.updatedAt,
      })
      .from(rechargeOperatorMapTable)
      .leftJoin(
        ServiceProviderMappingTable,
        eq(
          rechargeOperatorMapTable.serviceProviderMappingId,
          ServiceProviderMappingTable.id,
        ),
      )
      .leftJoin(
        ServiceTable,
        eq(ServiceProviderMappingTable.ServiceId, ServiceTable.id),
      )
      .leftJoin(
        ProviderTable,
        eq(ServiceProviderMappingTable.ProviderId, ProviderTable.id),
      );

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return query;
  }
}

export default new OperatorMapService();
