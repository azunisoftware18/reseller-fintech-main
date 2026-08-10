import crypto from 'node:crypto';
import { db } from '../../database/core/core-db.js';
import { eq, and, inArray, sql, count, or, like, desc } from 'drizzle-orm';

import { fundTransactionTable } from '../../models/fund-request/index.js';
import { ApiError } from '../../lib/ApiError.js';

import { buildTenantChain } from '../../lib/tenantHierarchy.util.js';
import { FUNDREQUEST_SERVICE_CODE } from '../../config/constant.js';

import { platformServiceResolve } from '../../lib/platformServiceResolver.util.js';
import { getFundRequestPlugin } from '../../plugin_registry/fund-request/pluginRegistry.js';

import WalletService from '../wallet.service.js';
import { tenantsTable } from '../../models/core/index.js';
import { generateNumber } from '../../lib/lib.js';

class FundTransactionService {
  // MAIN ENTRY
  static async initiateFundRequest({ payload, actor }) {
    const { amount, idempotencyKey, paymentMode, providerTxnId } = payload;

    if (!paymentMode) {
      throw ApiError.badRequest('Payment mode is required');
    }

    const tenantChain = await buildTenantChain(actor.tenantId);

    const { service, provider } = await platformServiceResolve({
      tenantChain,
      platformServiceCode: FUNDREQUEST_SERVICE_CODE,
    });

    if (provider.code === 'MANUAL' && !providerTxnId) {
      throw ApiError.badRequest(
        'Provider transaction ID/UTR No. is required for manual fund request',
      );
    }

    // 🔐 Idempotency check
    const existing = await db
      .select()
      .from(fundTransactionTable)
      .where(
        and(
          eq(fundTransactionTable.tenantId, actor.tenantId),
          eq(fundTransactionTable.idempotencyKey, idempotencyKey),
        ),
      )
      .limit(1);

    if (existing.length) {
      return {
        transactionId: existing[0].id,
        status: existing[0].status,
        duplicate: true,
      };
    }

    const transactionId = crypto.randomUUID();

    const [mainWallet] = await WalletService.getUserWallets(
      actor.id,
      actor.tenantId,
    ).then((w) => w.filter((x) => x.walletType === 'MAIN'));

    if (!mainWallet) {
      throw ApiError.notFound('Main wallet not found');
    }

    // 🔌 Resolve plugin
    const plugin = getFundRequestPlugin(provider.code, provider.config);  

    // 🧠 Create provider transaction
    const providerResponse = await plugin.createTransaction({
      amount,
      paymentMode,
    });

    await db.insert(fundTransactionTable).values({
      id: transactionId,
      idempotencyKey,
      tenantId: actor.tenantId,
      userId: actor.id,
      walletId: mainWallet.id,
      amount,
      paymentMode,
      referenceId: generateNumber('REF', 8),

      platformServiceId: service.id,
      platformServiceFeatureId: null,

      providerCode: provider.code,
      providerId: provider.providerId,
      providerConfig: provider.config,

      providerTxnId:
        provider.code === 'MANUAL'
          ? providerTxnId
          : providerResponse.providerTxnId,
      status: providerResponse.status,

      providerResponse: provider.providerResponse && provider.providerResponse,

      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      transactionId,
      status: providerResponse.status,
      paymentInstructions: providerResponse.instructions,
    };
  }

  // ADMIN APPROVE / REJECT
  static async changeStatus(id, payload, actor) {
    const { status, failureReason } = payload;

    if (!actor.isTenantOwner && actor.roleLevel !== 0) {
      throw ApiError.forbidden('Not allowed');
    }

    if (!['SUCCESS', 'REJECTED'].includes(status)) {
      throw ApiError.badRequest('Invalid status value');
    }

    const [txn] = await db
      .select()
      .from(fundTransactionTable)
      .where(eq(fundTransactionTable.id, id));

    if (!txn) {
      throw ApiError.notFound('Transaction not found');
    }

    if (txn.providerCode !== 'MANUAL') {
      throw ApiError.badRequest(
        'Only MANUAL fund requests can be approved or rejected manually',
      );
    }

    if (txn.status !== 'PENDING') {
      throw ApiError.badRequest('Only pending transactions can be processed');
    }

    if (status === 'REJECTED' && !failureReason) {
      throw ApiError.badRequest('Rejection reason is required');
    }

    if (status === 'SUCCESS' && !txn.providerTxnId) {
      throw ApiError.badRequest(
        'Provider transaction ID / UTR is required before approval',
      );
    }

    if (status === 'SUCCESS') {
      const payerWallet = await WalletService.getUserMainWallet(
  actor.id,
  actor.tenantId,
);

if (!payerWallet) {
  throw ApiError.notFound('Approver wallet not found');
}

      if (!payerWallet) {
        throw ApiError.notFound('Approver wallet not found');
      }

      if (actor.roleLevel !== 0 && payerWallet.balance < txn.amount) {
        throw ApiError.badRequest('Insufficient balance to approve');
      }

      await WalletService.debitWallet({
  walletId: payerWallet.id,
  amount: txn.amount,
  transactionId: null,
  reference: `FUND_APPROVE_DEBIT:${txn.referenceId}`,
  isSystem: actor.roleLevel === 0,
});

await WalletService.creditWallet({
  walletId: txn.walletId,
  amount: txn.amount,
  transactionId: null,
  reference: `FUND_APPROVE_CREDIT:${txn.referenceId}`,
});
    }

    await db
      .update(fundTransactionTable)
      .set({
        status,
        failureReason: status === 'REJECTED' ? failureReason : null,
        processedBy: actor.id,
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(fundTransactionTable.id, id));

    return { success: true };
  }

  // REFUND
  static async refund({ transactionId, actor }) {
    if (!actor.isTenantOwner && actor.roleLevel !== 0) {
      throw ApiError.forbidden('Not allowed');
    }

    await db.transaction(async (tx) => {
      const [txn] = await tx
        .select()
        .from(fundTransactionTable)
        .where(eq(fundTransactionTable.id, transactionId))
        .forUpdate()
        .limit(1);

      if (!txn || txn.status !== 'SUCCESS') {
        throw ApiError.badRequest('Not refundable');
      }

      await WalletService.debitWallet({
        walletId: txn.walletId,
        amount: txn.amount,
        reference: `FUND_REFUND:${txn.id}`,
      });

      await tx
        .update(fundTransactionTable)
        .set({
          status: 'REFUNDED',
          updatedAt: new Date(),
        })
        .where(eq(fundTransactionTable.id, transactionId));
    });

    return { success: true };
  }

  // get all txn
  static async findAll(query = {}, actor) {
    if (!actor?.tenantId) {
      throw ApiError.badRequest('Tenant context missing');
    }

    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 20;
    const offset = (page - 1) * limit;

    // 🔹 Get direct children
    const children = await db
      .select({ id: tenantsTable.id })
      .from(tenantsTable)
      .where(eq(tenantsTable.parentTenantId, actor.tenantId));

    if (!children.length) {
      return {
        data: [],
        meta: {
          total: 0,
          page,
          limit,
          stats: {},
          totalPages: 0,
        },
      };
    }

    const childTenantIds = children.map((c) => c.id);

    const conditions = [inArray(fundTransactionTable.tenantId, childTenantIds)];

    if (query.search) {
      const term = `%${query.search}%`;

      conditions.push(
        or(
          like(fundTransactionTable.providerTxnId, term),
          like(fundTransactionTable.referenceId, term),
          like(fundTransactionTable.providerCode, term),
          like(tenantsTable.tenantNumber, term),
          like(tenantsTable.tenantLegalName, term),
        ),
      );
    }

    if (query.status && query.status !== 'all') {
      conditions.push(eq(fundTransactionTable.status, query.status));
    }

    const [{ total }] = await db
      .select({ total: count().mapWith(Number) })
      .from(fundTransactionTable)
      .leftJoin(
        tenantsTable,
        eq(fundTransactionTable.tenantId, tenantsTable.id),
      )
      .where(and(...conditions));

    const statsRows = await db
      .select({
        status: fundTransactionTable.status,
        count: count().mapWith(Number),
      })
      .from(fundTransactionTable)
      .where(inArray(fundTransactionTable.tenantId, childTenantIds))
      .groupBy(fundTransactionTable.status);

    const stats = {
      SUCCESS: 0,
      PENDING: 0,
      FAILED: 0,
      REJECTED: 0,
    };

    statsRows.forEach((r) => {
      stats[r.status] = r.count;
    });

    const rows = await db
      .select({
        ...fundTransactionTable,
        tenantName: tenantsTable.tenantLegalName,
        tenantNumber: tenantsTable.tenantNumber,
      })
      .from(fundTransactionTable)
      .leftJoin(
        tenantsTable,
        eq(fundTransactionTable.tenantId, tenantsTable.id),
      )
      .where(and(...conditions))
      .orderBy(desc(fundTransactionTable.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: rows,
      meta: {
        total,
        page,
        limit,
        stats,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export default FundTransactionService;
