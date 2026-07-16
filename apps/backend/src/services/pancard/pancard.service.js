import crypto from 'node:crypto';
import { eq, and } from 'drizzle-orm';

import { db } from '../../database/core/core-db.js';
import { panSessionTable } from '../../models/pancard/index.js';

import { usersKycTable, kycDocumentTable } from '../../models/core/index.js';

import { ApiError } from '../../lib/ApiError.js';
import { getPanPlugin } from '../../plugin_registry/pancard/pluginRegistry.js';
import { encrypt } from '../../lib/lib.js';
import { buildTenantChain } from '../../lib/tenantHierarchy.util.js';
import { PANCARD_SERVICE_CODE } from '../../config/constant.js';
import PanRuntimeService from './pancardRuntime.service.js';
import WalletService from '../wallet.service.js';

class PancaredService {
  static async verifyPan({ payload, actor }) {
    const { panNumber, idempotencyKey } = payload;

    const tenantChain = await buildTenantChain(actor.tenantId);

    const { service, provider } = await PanRuntimeService.resolve({
      tenantChain,
      platformServiceCode: PANCARD_SERVICE_CODE,
    });

    // Idempotency check
    const existing = await db
      .select()
      .from(panSessionTable)
      .where(
        and(
          eq(panSessionTable.tenantId, actor.tenantId),
          eq(panSessionTable.idempotencyKey, idempotencyKey),
        ),
      )
      .limit(1);

    if (existing.length) {
      return {
        sessionId: existing[0].id,
        status: existing[0].status,
        duplicate: true,
      };
    }

    const sessionId = crypto.randomUUID();

    // 🔹 Get MAIN wallet
    const [mainWallet] = await WalletService.getUserWallets(
      actor.id,
      actor.tenantId,
    ).then((w) => w.filter((x) => x.walletType === 'MAIN'));

    if (!mainWallet) {
      throw ApiError.notFound('Main wallet not found');
    }

    // 🔹 Freeze provider config
    const encrypted = encrypt(panNumber);
    const masked = `${panNumber.slice(0, 3)}XXXXX${panNumber.slice(-1)}`;

    const plugin = getPanPlugin(provider.code, provider.config);

    const verifyResponse = await plugin.verifyPan({ panNumber });

    await db.transaction(async (tx) => {
      await tx.insert(panSessionTable).values({
        id: sessionId,
        tenantId: actor.tenantId,
        userId: actor.id,
        panNumberEncrypted: encrypted,
        panHash: crypto.createHash('sha256').update(panNumber).digest('hex'),
        maskedPan: masked,
        idempotencyKey,
        providerCode: provider.code,
        providerId: provider.providerId,
        providerTxnId: verifyResponse?.providerTxnId || null,
        status: verifyResponse?.isValid ? 'VERIFIED' : 'FAILED',
        responsePayload: verifyResponse,
        verifiedAt: verifyResponse?.isValid ? new Date() : null,
        consentGivenAt: new Date(),
        consentIp: actor.ip || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await tx.insert(kycDocumentTable).values({
        ownerType: 'USER',
        ownerId: actor.id,
        documentType: 'PAN',
        documentUrl: 'API_VERIFIED',
        documentNumber: masked,
        rowResponse: verifyResponse,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await tx
        .insert(usersKycTable)
        .values({
          userId: actor.id,
          verificationStatus: verifyResponse?.isValid ? 'VERIFIED' : 'FAILED',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onDuplicateKeyUpdate({
          set: { updatedAt: new Date() },
        });
    });

    return {
      sessionId,
      status: verifyResponse?.isValid ? 'VERIFIED' : 'FAILED',
    };
  }
}

export default PancaredService;
