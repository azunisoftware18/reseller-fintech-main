import { db } from '../../database/core/core-db.js';
import { ApiError } from '../../lib/ApiError.js';
import { getBanksPlugin } from '../../plugin_registry/bank/pluginRegistry.js';
import { apiEntityTable, transactionTable } from '../../models/core/index.js';
import { ServiceProviderMappingTable } from '../../models/core/serviceProviderMapping.schema.js';
import { ProviderTable } from '../../models/core/provider.schema.js';
import { ServiceTable } from '../../models/core/service.schema.js';
import { eq, and, gte, lte, like, or, desc, sql } from 'drizzle-orm';
import crypto from 'crypto';

class VerificationService {
  _generateRefId() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `VERIFY${timestamp}${random}`;
  }

  async _validateMapping() {
    const [mapping] = await db
      .select({
        id: ServiceProviderMappingTable.id,
        ServiceId: ServiceProviderMappingTable.ServiceId,
        ProviderId: ServiceProviderMappingTable.ProviderId,
        config: ServiceProviderMappingTable.config,
        isActive: ServiceProviderMappingTable.isActive,
        providerCode: ProviderTable.code,
      })
      .from(ServiceProviderMappingTable)
      .leftJoin(
        ProviderTable,
        eq(ServiceProviderMappingTable.ProviderId, ProviderTable.id),
      )
      .where(eq(ProviderTable.code, 'PAYSPRINT'))
      .limit(1);

    if (!mapping) {
      throw ApiError.badRequest('PAYSPRINT service provider mapping not found');
    }

    if (!mapping.isActive) {
      throw ApiError.badRequest(
        'PAYSPRINT service provider mapping is inactive',
      );
    }

    return mapping;
  }

  async pennyDropVerification({ account_number, ifsc_code }, user) {
    // Validate mapping
    const mapping = await this._validateMapping();

    // Generate reference ID
    const refId = this._generateRefId();
    const apiEntityId = crypto.randomUUID();
    const now = new Date();

    // Create API entity record
    await db.insert(apiEntityTable).values({
      id: apiEntityId,
      tenantId: user.tenantId,
      userId: user.id,
      reference: refId,
      status: 'PENDING',
      requestPayload: { account_number, ifsc_code },
      createdAt: now,
      updatedAt: now,
    });

    try {
      // Get plugin and perform verification
      const plugin = getBanksPlugin(mapping.providerCode, mapping.config);
      const verificationResponse = await plugin.verify({
        accountNumber: account_number,
        ifscCode: ifsc_code,
        refId,
      });

      const isSuccess =
        verificationResponse.status === true ||
        verificationResponse.status === 'SUCCESS';

      const status = isSuccess ? 'COMPLETED' : 'FAILED';
      const beneficiaryName = verificationResponse.beneficiaryName;

      // Update API entity record with response
      await db
        .update(apiEntityTable)
        .set({
          status,
          providerInitData: verificationResponse.providerReference
            ? { providerReference: verificationResponse.providerReference }
            : null,
          providerFinalData: verificationResponse.data || null,
          errorData:
            status === 'FAILED'
              ? { message: verificationResponse.message }
              : null,
          completedAt: status === 'COMPLETED' ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(apiEntityTable.id, apiEntityId));

      return {
        success: true,
        data: {
          verificationId: apiEntityId,
          refId,
          status: isSuccess ? 'SUCCESS' : 'FAILED',
          message: verificationResponse.message,
          beneficiaryName,
        },
      };
    } catch (error) {
      await db
        .update(apiEntityTable)
        .set({
          status: 'FAILED',
          errorData: { message: error.message },
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(apiEntityTable.id, apiEntityId));

      throw error;
    }
  }
}

export default new VerificationService();
