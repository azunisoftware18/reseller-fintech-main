import { and, eq, sql } from 'drizzle-orm';
import { smtpConfigTable } from '../models/core/index.js';
import { db } from '../database/core/core-db.js';
import { ApiError } from '../lib/ApiError.js';
import crypto from 'node:crypto';
import { decrypt, encrypt } from '../lib/lib.js';

class SmtpConfigService {
  // ================= GET =================
  static async getByTenant(actor) {
    if (!actor?.tenantId) {
      throw ApiError.unauthorized('Invalid actor');
    }

    const [config] = await db
      .select()
      .from(smtpConfigTable)
      .where(eq(smtpConfigTable.tenantId, actor.tenantId))
      .limit(1);

    if (!config) {
      throw ApiError.notFound('SMTP config not found');
    }

    return {
      ...config,
      smtpPassword: decrypt(config.smtpPassword),
    };
  }

  // ================= CREATE =================
  static async create(payload, actor) {
    if (!actor?.tenantId) {
      throw ApiError.unauthorized('Invalid actor');
    }

    const [existing] = await db
      .select({ id: smtpConfigTable.id })
      .from(smtpConfigTable)
      .where(eq(smtpConfigTable.tenantId, actor.tenantId))
      .limit(1);

    if (existing) {
      throw ApiError.conflict('SMTP config already exists');
    }

    const id = crypto.randomUUID();

    await db.insert(smtpConfigTable).values({
      id,
      tenantId: actor.tenantId,
      smtpHost: payload.smtpHost,
      smtpPort: payload.smtpPort,
      smtpUsername: payload.smtpUsername,
      smtpPassword: encrypt(payload.smtpPassword),
      encryptionType: payload.encryptionType?.toUpperCase(),
      fromName: payload.fromName,
      fromEmail: payload.fromEmail,
      createdByUserId: actor.type === 'USER' ? actor.id : null,
      createdByEmployeeId: actor.type === 'EMPLOYEE' ? actor.id : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.getByTenant(actor);
  }

  // ================= UPDATE =================
  static async update(payload, actor) {
    const existing = await this.getByTenant(actor);

    const updates = {
      smtpHost: payload.smtpHost ?? existing.smtpHost,
      smtpPort: payload.smtpPort ?? existing.smtpPort,
      smtpUser: payload.smtpUser ?? existing.smtpUser,
      encryptionType:
        payload.encryptionType?.toUpperCase() ?? existing.encryptionType,
      updatedAt: new Date(),
    };

    if (payload.smtpPassword) {
      updates.smtpPassword = encrypt(payload.smtpPassword);
    }

    await db
      .update(smtpConfigTable)
      .set(updates)
      .where(eq(smtpConfigTable.id, existing.id));

    return this.getByTenant(actor);
  }
}

export { SmtpConfigService };
