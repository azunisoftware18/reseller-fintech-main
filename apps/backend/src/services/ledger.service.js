import { db } from '../database/core/core-db.js';
import {
  ledgerTable,
  transactionTable,
  walletTable,
} from '../models/core/index.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import { ApiError } from '../lib/ApiError.js';
import crypto from 'crypto';
import WalletService from './wallet.service.js';

class LedgerService {
  // ==================== CREATE LEDGER ENTRY ====================

  async createEntry({
    tenantId,
    walletId,
    transactionId = null,
    refundId = null,
    apiEntityId = null,
    reference,
    entryType,
    amount,
    balanceAfter,
    blockedAfter = 0,
    availableAfter = 0,
    metadata = {},
    tx = null,
  }) {
    const dbClient = tx || db;

    const validTypes = [
      'DEBIT',
      'CREDIT',
      'BLOCK',
      'UNBLOCK',

      'TDS_LIABILITY',
      'GST_LIABILITY',
      'TDS_PAID',
    ];
    if (!validTypes.includes(entryType)) {
      throw ApiError.badRequest(
        `Invalid entry type. Must be one of: ${validTypes.join(', ')}`,
      );
    }

    const [existing] = await dbClient
      .select({ id: ledgerTable.id })
      .from(ledgerTable)
      .where(
        and(
          eq(ledgerTable.tenantId, tenantId),
          eq(ledgerTable.reference, reference),
        ),
      )
      .limit(1);

    if (existing) {
      return { id: existing.id, alreadyExists: true };
    }

    const entryId = crypto.randomUUID();

    await dbClient.insert(ledgerTable).values({
      id: entryId,
      tenantId,
      walletId,
      transactionId,
      refundId,
      apiEntityId,
      reference,
      entryType,

      amount: BigInt(amount),

      balanceAfter: BigInt(balanceAfter),

      blockedAfter: BigInt(blockedAfter),

      availableAfter: BigInt(availableAfter),

      metadata,

      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      id: entryId,
      alreadyExists: false,
    };
  }

  // ==================== QUERY METHODS ====================

  // Get ledger entries for a wallet
  static async getWalletLedger({
    walletId,
    tenantId,
    limit = 50,
    offset = 0,
    entryType = null,
    startDate = null,
    endDate = null,
  }) {
    let query = db
      .select()
      .from(ledgerTable)
      .where(
        and(
          eq(ledgerTable.walletId, walletId),
          eq(ledgerTable.tenantId, tenantId),
        ),
      )
      .orderBy(desc(ledgerTable.createdAt))
      .limit(limit)
      .offset(offset);

    if (entryType) {
      query = query.where(eq(ledgerTable.entryType, entryType));
    }

    if (startDate) {
      query = query.where(sql`${ledgerTable.createdAt} >= ${startDate}`);
    }

    if (endDate) {
      query = query.where(sql`${ledgerTable.createdAt} <= ${endDate}`);
    }

    return await query;
  }

  // Get ledger entries for a transaction
  static async getTransactionLedger(transactionId, tenantId) {
    return await db
      .select()
      .from(ledgerTable)
      .where(
        and(
          eq(ledgerTable.transactionId, transactionId),
          eq(ledgerTable.tenantId, tenantId),
        ),
      )
      .orderBy(desc(ledgerTable.createdAt));
  }

  // Get ledger summary for a wallet
  static async getWalletLedgerSummary(walletId, tenantId) {
    const [summary] = await db
      .select({
        totalCredits: sql`SUM(CASE WHEN ${ledgerTable.entryType} = 'CREDIT' THEN ${ledgerTable.amount} ELSE 0 END)`,
        totalDebits: sql`SUM(CASE WHEN ${ledgerTable.entryType} = 'DEBIT' THEN ${ledgerTable.amount} ELSE 0 END)`,
        totalBlocks: sql`SUM(CASE WHEN ${ledgerTable.entryType} = 'BLOCK' THEN ${ledgerTable.amount} ELSE 0 END)`,
        totalUnblocks: sql`SUM(CASE WHEN ${ledgerTable.entryType} = 'UNBLOCK' THEN ${ledgerTable.amount} ELSE 0 END)`,
        entryCount: sql`COUNT(*)`,
        lastEntryDate: sql`MAX(${ledgerTable.createdAt})`,
      })
      .from(ledgerTable)
      .where(
        and(
          eq(ledgerTable.walletId, walletId),
          eq(ledgerTable.tenantId, tenantId),
        ),
      );

    return summary;
  }

  // Get daily ledger summary for reconciliation
  static async getDailyLedgerSummary(tenantId, date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await db
      .select({
        entryType: ledgerTable.entryType,
        totalAmount: sql`SUM(${ledgerTable.amount})`,
        count: sql`COUNT(*)`,
      })
      .from(ledgerTable)
      .where(
        and(
          eq(ledgerTable.tenantId, tenantId),
          sql`${ledgerTable.createdAt} BETWEEN ${startOfDay} AND ${endOfDay}`,
        ),
      )
      .groupBy(ledgerTable.entryType);
  }

  // Verify ledger integrity for a wallet
  static async verifyWalletLedgerIntegrity(walletId, tenantId) {
    const [wallet] = await db
      .select()
      .from(walletTable)
      .where(
        and(eq(walletTable.id, walletId), eq(walletTable.tenantId, tenantId)),
      )
      .limit(1);

    if (!wallet) {
      throw ApiError.notFound('Wallet not found');
    }

    const summary = await this.getWalletLedgerSummary(walletId, tenantId);

    const calculatedBalance =
      (Number(summary.totalCredits) || 0) - (Number(summary.totalDebits) || 0);

    const calculatedBlocked =
      (Number(summary.totalBlocks) || 0) - (Number(summary.totalUnblocks) || 0);

    return {
      walletBalance: Number(wallet.balance),
      calculatedBalance,
      walletBlocked: Number(wallet.blockedAmount || 0),
      calculatedBlocked,
      isBalanced:
        calculatedBalance === Number(wallet.balance) &&
        calculatedBlocked === Number(wallet.blockedAmount || 0),
      discrepancy: calculatedBalance - Number(wallet.balance),
      summary,
    };
  }

  buildLedgerConditions(walletId, query) {
    const conditions = [eq(ledgerTable.walletId, walletId)];

    if (query.entryType && query.entryType !== 'ALL') {
      conditions.push(eq(ledgerTable.entryType, query.entryType));
    }

    if (query.fromDate) {
      conditions.push(gte(ledgerTable.createdAt, new Date(query.fromDate)));
    }

    if (query.toDate) {
      conditions.push(lte(ledgerTable.createdAt, new Date(query.toDate)));
    }

    if (query.search) {
      const searchTerm = `%${query.search}%`;
      conditions.push(
        sql`(
          ${ledgerTable.reference} LIKE ${searchTerm} OR 
          ${ledgerTable.transactionId} LIKE ${searchTerm}
        )`,
      );
    }

    return conditions;
  }

  getSortColumn(table, sortBy, sortOrder) {
    const columnMap = {
      createdAt: table.createdAt,
      amount: table.amount,
      entryType: table.entryType,
    };
    const column = columnMap[sortBy] || table.createdAt;
    return sortOrder === 'asc' ? asc(column) : desc(column);
  }

  async getMyLedger(actor, query) {
    if (!actor?.id) throw ApiError.unauthorized('Actor is required');

    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    // Get user's wallet — ONLY own data
    const wallet = await WalletService.getUserMainWallet(
      actor.id,
      actor.tenantId,
    );

    if (!wallet) {
      return {
        data: [],
        meta: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          walletBalance: 0,
          walletBlocked: 0,
        },
      };
    }

    const whereConditions = this.buildLedgerConditions(wallet.id, query);

    // Count
    const [countResult] = await db
      .select({ count: sql`COUNT(*)`.mapWith(Number) })
      .from(ledgerTable)
      .where(and(...whereConditions));

    // Data with transaction join
    const ledgerEntries = await db
      .select({
        id: ledgerTable.id,
        tenantId: ledgerTable.tenantId,
        walletId: ledgerTable.walletId,
        transactionId: ledgerTable.transactionId,
        refundId: ledgerTable.refundId,
        apiEntityId: ledgerTable.apiEntityId,
        reference: ledgerTable.reference,
        entryType: ledgerTable.entryType,
        amount: ledgerTable.amount,
        balanceAfter: ledgerTable.balanceAfter,
        metadata: ledgerTable.metadata,
        createdAt: ledgerTable.createdAt,
        updatedAt: ledgerTable.updatedAt,
        transaction: {
          txnId: transactionTable.txnId,
          amount: transactionTable.amount,
          status: transactionTable.status,
          serviceType: transactionTable.serviceType,
        },
      })
      .from(ledgerTable)
      .leftJoin(
        transactionTable,
        eq(ledgerTable.transactionId, transactionTable.id),
      )
      .where(and(...whereConditions))
      .orderBy(this.getSortColumn(ledgerTable, query.sortBy, query.sortOrder))
      .limit(limit)
      .offset(offset);

    // Summary
    const [summary] = await db
      .select({
        totalCredits:
          sql`COALESCE(SUM(CASE WHEN ${ledgerTable.entryType} = 'CREDIT' THEN ${ledgerTable.amount} ELSE 0 END), 0)`.mapWith(
            Number,
          ),
        totalDebits:
          sql`COALESCE(SUM(CASE WHEN ${ledgerTable.entryType} = 'DEBIT' THEN ${ledgerTable.amount} ELSE 0 END), 0)`.mapWith(
            Number,
          ),
        totalBlocks:
          sql`COALESCE(SUM(CASE WHEN ${ledgerTable.entryType} = 'BLOCK' THEN ${ledgerTable.amount} ELSE 0 END), 0)`.mapWith(
            Number,
          ),
        totalUnblocks:
          sql`COALESCE(SUM(CASE WHEN ${ledgerTable.entryType} = 'UNBLOCK' THEN ${ledgerTable.amount} ELSE 0 END), 0)`.mapWith(
            Number,
          ),
      })
      .from(ledgerTable)
      .where(eq(ledgerTable.walletId, wallet.id));

    return {
      data: ledgerEntries,
      meta: {
        page,
        limit,
        total: countResult.count,
        totalPages: Math.ceil(countResult.count / limit),
        walletBalance: Number(wallet.balance),
        walletBlocked: Number(wallet.blockedAmount || 0),
        summary: {
          totalCredits: summary.totalCredits,
          totalDebits: summary.totalDebits,
          totalBlocks: summary.totalBlocks,
          totalUnblocks: summary.totalUnblocks,
          netBalance: summary.totalCredits - summary.totalDebits,
          netBlocked: summary.totalBlocks - summary.totalUnblocks,
        },
      },
    };
  }
}

export default new LedgerService();
