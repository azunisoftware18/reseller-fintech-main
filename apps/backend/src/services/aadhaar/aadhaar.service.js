import crypto from 'node:crypto';
import { desc, eq } from 'drizzle-orm';
import { db } from '../../database/core/core-db.js';
// import { platformServiceResolve } from '../../lib/platformServiceResolver.util.js';
import { getAadhaarPlugin } from '../../plugin_registry/aadhaar/pluginRegistry.js';
import { ApiError } from '../../lib/ApiError.js';
import { decrypt, encrypt, generateNumber } from '../../lib/lib.js';

import { aadhaarTransactionTable } from '../../models/aadhaar/index.js';

import { usersKycTable, kycDocumentTable } from '../../models/core/index.js';
import { buildTenantChain } from '../../lib/tenantHierarchy.util.js';
import { AADHAAR_SERVICE_CODE } from '../../config/constant.js';
// import SurchargeEngine from '../../lib/surcharge.engine.js';
import s3Service from '../../lib/S3Service.js';

class AadhaarService {
  static async sendOtp({ aadhaarNumber, actor }) {
    const tenantChain = await buildTenantChain(actor.tenantId);

    const { service, provider } = await platformServiceResolve({
      tenantChain,
      platformServiceCode: AADHAAR_SERVICE_CODE,
    });

    const masked = `XXXX-XXXX-${aadhaarNumber.slice(-4)}`;
    const encrypted = encrypt(aadhaarNumber);

    // 🔎 Find latest transaction for this user
    const [existingTxn] = await db
      .select()
      .from(aadhaarTransactionTable)
      .where(eq(aadhaarTransactionTable.userId, actor.id))
      .orderBy(desc(aadhaarTransactionTable.createdAt))
      .limit(1);

    const now = new Date();

    if (existingTxn) {
      const isSameAadhaar = existingTxn.maskedAadhaar === masked;

      const isActiveStatus = ['INITIATED', 'OTP_SENT'].includes(
        existingTxn.status,
      );

      const isExpired = now - new Date(existingTxn.createdAt) > 10 * 60 * 1000; // 10 min expiry

      // 🚨 Already verified
      if (existingTxn.status === 'SUCCESS' && isSameAadhaar) {
        throw ApiError.conflict(
          'This Aadhaar is already verified for this account.',
        );
      }

      // 🔁 Same Aadhaar + Active + Not Expired
      if (isSameAadhaar && isActiveStatus && !isExpired) {
        if (existingTxn.attemptCount >= 3) {
          throw ApiError.badRequest('Maximum OTP attempts reached');
        }

        const plugin = getAadhaarPlugin(
          existingTxn.providerCode,
          existingTxn.providerConfig,
        );

        const response = await plugin.sendOtp({ aadhaarNumber });

        await db
          .update(aadhaarTransactionTable)
          .set({
            attemptCount: existingTxn.attemptCount + 1,
            providerResponse: response.raw,
            updatedAt: now,
          })
          .where(eq(aadhaarTransactionTable.id, existingTxn.id));

        return {
          transactionId: existingTxn.id,
          referenceId: existingTxn.referenceId,
          mode: existingTxn.providerCode,
          status:
            existingTxn.providerCode === 'MANUAL_AADHAAR'
              ? 'MANUAL_FLOW'
              : 'OTP_SENT',
          maskedAadhaar: masked,
        };
      }

      // 🧹 If expired OR different Aadhaar → allow new transaction
    }

    // 🆕 CREATE NEW TRANSACTION
    const transactionId = crypto.randomUUID();

    const transaction = {
      id: transactionId,
      tenantId: actor.tenantId,
      platformServiceId: service.id,
      platformServiceFeatureId: null,
      amount: 0,
    };

    const { finalAmount } = await SurchargeEngine.calculate({
      transaction,
      user: actor,
    });

    if (finalAmount > 0) {
      await WalletService.blockAmount({
        walletId: mainWallet.id,
        amount: finalAmount,
        transactionId,
        reference: `AADHAAR:${transactionId}`,
      });
    }

    const plugin = getAadhaarPlugin(provider.code, provider.providerConfig);

    const response = await plugin.sendOtp({ aadhaarNumber });

    const ref =
      provider.code === 'MANUAL_AADHAAR'
        ? generateNumber('REF', 4)
        : response.referenceId;

    await db.insert(aadhaarTransactionTable).values({
      id: transactionId,
      userId: actor.id,
      tenantId: actor.tenantId,
      usersKycId: null,
      maskedAadhaar: masked,
      aadhaarEncrypted: encrypted,
      referenceId: ref,
      providerCode: provider.code,
      providerConfig: provider.providerConfig,
      providerResponse: response.raw,
      failureReason:
        response?.data?.status !== 'SUCCESS' ? response.message : null,
      status: provider.code === 'MANUAL_AADHAAR' ? 'INITIATED' : 'OTP_SENT',
      attemptCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    return {
      transactionId,
      referenceId: ref,
      mode: provider.code,
      status: provider.code === 'MANUAL_AADHAAR' ? 'MANUAL_FLOW' : 'OTP_SENT',
      maskedAadhaar: masked,
    };
  }

  static async verify({ transactionId, otp, formData, actor, files }) {
    const [txn] = await db
      .select()
      .from(aadhaarTransactionTable)
      .where(eq(aadhaarTransactionTable.id, transactionId))
      .limit(1);

    if (!txn) throw ApiError.notFound('Transaction not found');

    const isManual = txn.providerCode === 'MANUAL_AADHAAR';

    if (!files?.aadhaarPdf?.[0]) {
      throw ApiError.badRequest('Aadhaar PDF file is required');
    }

    if (isManual) {
      if (!files?.profilePhoto?.[0])
        throw ApiError.badRequest('Profile photo is required');

      if (!formData) throw ApiError.badRequest('Form data is required');

      if (typeof formData === 'string') {
        formData = JSON.parse(formData);
      }
    } else {
      if (!otp) throw ApiError.badRequest('OTP is required');
    }

    const plugin = getAadhaarPlugin(txn.providerCode, txn.providerConfig);

    let verifyResponse;

    if (isManual) {
      const decrypted = decrypt(txn.aadhaarEncrypted);

      verifyResponse = await plugin.verifyOtp({
        aadhaarNumber: decrypted,
        formData,
        files,
      });
    } else {
      verifyResponse = await plugin.verifyOtp({
        referenceId: txn.referenceId,
        otp,
      });
    }

    // 🔥 FIXED STATUS LOGIC
    const providerStatus =
      verifyResponse?.data?.status || (isManual ? 'PENDING' : 'FAILED');

    let profileKey = null;
    let aadhaarPdfKey = null;

    // Upload PDF (both flows)
    const pdfUpload = await s3Service.upload(files.aadhaarPdf[0].path, 'kyc');
    aadhaarPdfKey = pdfUpload.key;

    // Manual profile upload
    if (isManual) {
      const profileUpload = await s3Service.upload(
        files.profilePhoto[0].path,
        'kyc',
      );
      profileKey = profileUpload.key;
    }

    // API profile (base64)
    if (!isManual && verifyResponse?.data?.photo_link) {
      const raw = verifyResponse.data.photo_link.replace(
        /^https:\/\/api\.bulkpe\.in\/png;base64,/,
        '',
      );

      const matches = raw.match(/^data:(.+);base64,/);
      const mimeType = matches ? matches[1] : 'image/png';
      const extension = mime.extension(mimeType) || 'png';

      const base64Data = raw.replace(/^data:.+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const upload = await s3Service.uploadBuffer(
        buffer,
        'kyc',
        extension,
        mimeType,
      );

      profileKey = upload.key;
    }

    await db.transaction(async (tx) => {
      await tx
        .update(aadhaarTransactionTable)
        .set({
          status: providerStatus,
          providerResponse: verifyResponse?.data || null,
          updatedAt: new Date(),
        })
        .where(eq(aadhaarTransactionTable.id, transactionId));

      const [existingKyc] = await tx
        .select()
        .from(usersKycTable)
        .where(eq(usersKycTable.userId, actor.id))
        .limit(1);

      let usersKycId = existingKyc?.id || crypto.randomUUID();

      if (!existingKyc) {
        await tx.insert(usersKycTable).values({
          id: usersKycId,
          userId: actor.id,
          verificationStatus: 'PENDING_REVIEW',
          aadhaarStatus: providerStatus,
          kycMode: txn.providerCode,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        await tx
          .update(usersKycTable)
          .set({
            aadhaarStatus: providerStatus,
            verificationStatus: 'PENDING_REVIEW',
            updatedAt: new Date(),
          })
          .where(eq(usersKycTable.userId, actor.id));
      }

      // Aadhaar PDF
      await tx.insert(kycDocumentTable).values({
        ownerType: 'USER',
        ownerId: actor.id,
        documentType: 'AADHAAR_PDF',
        platformCode: txn.providerCode,
        documentUrl: aadhaarPdfKey,
        documentNumber: txn.maskedAadhaar,
        rowResponse: null, // 🔥 FIXED
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Profile Photo
      if (profileKey) {
        await tx.insert(kycDocumentTable).values({
          ownerType: 'USER',
          ownerId: actor.id,
          documentType: 'PROFILE_PHOTO',
          platformCode: txn.providerCode,
          documentUrl: profileKey,
          rowResponse: null, // 🔥 FIXED
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      await tx
        .update(aadhaarTransactionTable)
        .set({ usersKycId })
        .where(eq(aadhaarTransactionTable.id, transactionId));
    });

    return {
      status: 'SUBMITTED_FOR_REVIEW',
    };
  }

  static async getStatus(actor) {
    const [txn] = await db
      .select()
      .from(aadhaarTransactionTable)
      .where(eq(aadhaarTransactionTable.userId, actor.id))
      .orderBy(desc(aadhaarTransactionTable.createdAt))
      .limit(1);

    if (!txn) {
      return {
        status: 'NOT_STARTED',
      };
    }

    return {
      status: txn.status,
      transactionId: txn.id,
      maskedAadhaar: txn.maskedAadhaar,
      providerCode: txn.providerCode,
    };
  }
}

export default AadhaarService;
