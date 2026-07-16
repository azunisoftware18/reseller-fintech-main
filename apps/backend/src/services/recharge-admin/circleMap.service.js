import { db } from '../../database/core/core-db.js';
import { ProviderTable } from '../../models/core/provider.schema.js';
import { ServiceTable } from '../../models/core/service.schema.js';
import { ApiError } from '../../lib/ApiError.js';
import crypto from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { rechargeCircleMapTable } from '../../models/core/rechargeCircleMapping.schema.js';
import { ServiceProviderMappingTable } from '../../models/core/serviceProviderMapping.schema.js';

class CircleMapService {
  async upsert(data, actor) {
    if (actor.roleLevel !== 0) {
      throw ApiError.forbidden('Only AZZUNIQUE allowed');
    }

    // Verify the mapping exists
    const [mapping] = await db
      .select({ id: ServiceProviderMappingTable.id })
      .from(ServiceProviderMappingTable)
      .where(eq(ServiceProviderMappingTable.id, data.serviceProviderMappingId))
      .limit(1);

    if (!mapping) {
      throw ApiError.badRequest('Service-Provider mapping not found');
    }

    const now = new Date();

    const [existing] = await db
      .select({ id: rechargeCircleMapTable.id })
      .from(rechargeCircleMapTable)
      .where(
        and(
          eq(
            rechargeCircleMapTable.internalCircleCode,
            data.internalCircleCode,
          ),
          eq(
            rechargeCircleMapTable.serviceProviderMappingId,
            data.serviceProviderMappingId,
          ),
          eq(rechargeCircleMapTable.direction, data.direction),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .update(rechargeCircleMapTable)
        .set({
          providerCircleCode: data.providerCircleCode,
          updatedAt: now,
        })
        .where(eq(rechargeCircleMapTable.id, existing.id));
    } else {
      await db.insert(rechargeCircleMapTable).values({
        id: crypto.randomUUID(),
        serviceProviderMappingId: data.serviceProviderMappingId,
        internalCircleCode: data.internalCircleCode,
        providerCircleCode: data.providerCircleCode,
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
        providerCircleCode: rechargeCircleMapTable.providerCircleCode,
      })
      .from(rechargeCircleMapTable)
      .where(
        and(
          eq(rechargeCircleMapTable.internalCircleCode, internalCode),
          eq(
            rechargeCircleMapTable.serviceProviderMappingId,
            serviceProviderMappingId,
          ),
          eq(rechargeCircleMapTable.direction, direction),
        ),
      )
      .limit(1);

    return result?.providerCircleCode || null;
  }

  async list(filters = {}) {
    let conditions = [];

    if (filters.direction) {
      conditions.push(eq(rechargeCircleMapTable.direction, filters.direction));
    }
    if (filters.serviceProviderMappingId) {
      conditions.push(
        eq(
          rechargeCircleMapTable.serviceProviderMappingId,
          filters.serviceProviderMappingId,
        ),
      );
    }

    let query = db
      .select({
        id: rechargeCircleMapTable.id,
        internalCircleCode: rechargeCircleMapTable.internalCircleCode,
        providerCircleCode: rechargeCircleMapTable.providerCircleCode,
        direction: rechargeCircleMapTable.direction,
        serviceProviderMappingId:
          rechargeCircleMapTable.serviceProviderMappingId,
        serviceName: ServiceTable.name,
        providerName: ProviderTable.providerName,
        createdAt: rechargeCircleMapTable.createdAt,
        updatedAt: rechargeCircleMapTable.updatedAt,
      })
      .from(rechargeCircleMapTable)
      .leftJoin(
        ServiceProviderMappingTable,
        eq(
          rechargeCircleMapTable.serviceProviderMappingId,
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

export default new CircleMapService();
