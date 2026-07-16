import { db } from '../database/core/core-db.js';
import { walletTable } from '../models/core/index.js';
import { eq, and } from 'drizzle-orm';
import { ApiError } from '../lib/ApiError.js';
import crypto from 'crypto';
import { rupeesToPaise, paiseToRupees } from '../lib/lib.js';
import LedgerService from './ledger.service.js';

class WalletService {
  // ==================== PRIVATE HELPERS ====================

  static async _getWallet(walletId, tx = null) {
    const dbClient = tx || db;
    const [wallet] = await dbClient
      .select()
      .from(walletTable)
      .where(eq(walletTable.id, walletId))
      .limit(1);

    if (!wallet) {
      throw ApiError.notFound('Wallet not found');
    }
    return wallet;
  }

  static async _addLedgerEntry({
    tx,
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
  }) {
    await LedgerService.createEntry({
      tenantId,
      walletId,

      transactionId,
      refundId,
      apiEntityId,

      reference: reference || crypto.randomUUID(),

      entryType,

      amount: BigInt(amount),

      balanceAfter: BigInt(balanceAfter),

      blockedAfter: BigInt(blockedAfter),

      availableAfter: BigInt(availableAfter),

      metadata,

      tx,
    });
  }

  // CREATE WALLET (supports any walletType)
  static async createMainWallet({
    tenantId,
    ownerType,
    ownerId,
    walletType = 'MAIN',
  }) {
    const [existing] = await db
      .select({ id: walletTable.id })
      .from(walletTable)
      .where(
        and(
          eq(walletTable.tenantId, tenantId),
          eq(walletTable.ownerType, ownerType),
          eq(walletTable.ownerId, ownerId),
          eq(walletTable.walletType, walletType),
        ),
      )
      .limit(1);

    if (existing) return { id: existing.id };

    const walletId = crypto.randomUUID();

    await db.insert(walletTable).values({
      id: walletId,
      tenantId,
      ownerType,
      ownerId,
      walletType,
      balance: BigInt(0),
      blockedAmount: BigInt(0),
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { id: walletId };
  }

  static async createDefaultUserWallets(user) {
    const { roleCode } = user;

    const multiWalletRoles = ['AZZUNIQUE', 'RESELLER', 'WHITE_LABEL'];

    if (multiWalletRoles.includes(roleCode)) {
      for (const walletType of ['MAIN', 'GST', 'TDS']) {
        await this.createMainWallet({
          tenantId: user.tenantId,
          ownerType: 'USER',
          ownerId: user.id,
          walletType,
        });
      }
    } else {
      await this.createMainWallet({
        tenantId: user.tenantId,
        ownerType: 'USER',
        ownerId: user.id,
        walletType: 'MAIN',
      });
    }
  }

  // ==================== WALLET FETCH HELPERS ====================

  static async getUserWalletByType(userId, tenantId, walletType) {
    const [wallet] = await db
      .select()
      .from(walletTable)
      .where(
        and(
          eq(walletTable.ownerType, 'USER'),
          eq(walletTable.ownerId, userId),
          eq(walletTable.tenantId, tenantId),
          eq(walletTable.walletType, walletType),
        ),
      )
      .limit(1);

    return wallet || null;
  }

  static async getUserMainWallet(userId, tenantId) {
    return this.getUserWalletByType(userId, tenantId, 'MAIN');
  }

  static async getUserTDSWallet(userId, tenantId) {
    return this.getUserWalletByType(userId, tenantId, 'TDS');
  }

  static async getUserGSTWallet(userId, tenantId) {
    return this.getUserWalletByType(userId, tenantId, 'GST');
  }

  // ==================== BALANCE OPERATIONS ====================

  // CREDIT WALLET (amount in paise)
  static async creditWallet({
    walletId,
    amount,
    apiEntityId = null,
    transactionId = null,
    refundId = null,
    reference = null,
    tx = null,
  }) {
    const amountInPaise = Number(amount);

    if (amountInPaise <= 0) {
      throw ApiError.badRequest('Invalid credit amount');
    }

    const executor = async (trx) => {
      const wallet = await this._getWallet(walletId, trx);

      const currentBalance = Number(wallet.balance);
      const currentBlocked = Number(wallet.blockedAmount || 0);

      const newBalance = currentBalance + amountInPaise;

      await trx
        .update(walletTable)
        .set({
          balance: BigInt(newBalance),
          updatedAt: new Date(),
        })
        .where(eq(walletTable.id, walletId));

      await this._addLedgerEntry({
        tx: trx,
        tenantId: wallet.tenantId,
        walletId,
        apiEntityId,
        transactionId,
        refundId,
        reference,
        entryType: 'CREDIT',
        amount: amountInPaise,
        balanceAfter: newBalance,
        blockedAfter: currentBlocked,
        availableAfter: newBalance - currentBlocked,
      });
    };

    if (tx) {
      return executor(tx);
    }

    return db.transaction(executor);
  }

  // DEBIT WALLET (amount in paise)
  static async debitWallet({
    walletId,
    amount,
    apiEntityId = null,
    transactionId = null,
    reference = null,
    tx = null,
  }) {
    const amountInPaise = Number(amount);

    if (amountInPaise <= 0) {
      throw ApiError.badRequest('Invalid debit amount');
    }

    const executor = async (trx) => {
      const wallet = await this._getWallet(walletId, trx);

      const currentBalance = Number(wallet.balance);

      if (currentBalance < amountInPaise) {
        throw ApiError.badRequest('Insufficient balance');
      }

      const newBalance = currentBalance - amountInPaise;

      await trx
        .update(walletTable)
        .set({
          balance: BigInt(newBalance),
          updatedAt: new Date(),
        })
        .where(eq(walletTable.id, walletId));

      const currentBlocked = Number(wallet.blockedAmount || 0);

      await this._addLedgerEntry({
        tx: trx,
        tenantId: wallet.tenantId,
        walletId,

        apiEntityId,
        transactionId,

        reference,

        entryType: 'DEBIT',

        amount: amountInPaise,

        balanceAfter: newBalance,

        blockedAfter: currentBlocked,

        availableAfter: newBalance - currentBlocked,
      });
    };

    if (tx) {
      return executor(tx);
    }

    return db.transaction(executor);
  }

  // ==================== BLOCKED AMOUNT OPERATIONS ====================

  // BLOCK AMOUNT (amount in paise)
  static async blockAmount({
    walletId,
    amount,
    apiEntityId,
    transactionId,
    reference = null,
    tx = null,
  }) {
    const amountInPaise = Number(amount);

    if (amountInPaise <= 0) {
      throw ApiError.badRequest('Invalid block amount');
    }

    const executor = async (trx) => {
      const wallet = await this._getWallet(walletId, trx);

      const currentBalance = Number(wallet.balance);
      const currentBlocked = Number(wallet.blockedAmount || 0);
      const available = currentBalance - currentBlocked;

      if (available < amountInPaise) {
        throw ApiError.badRequest('Insufficient available balance');
      }

      const newBlocked = currentBlocked + amountInPaise;

      await trx
        .update(walletTable)
        .set({
          blockedAmount: BigInt(newBlocked),
          updatedAt: new Date(),
        })
        .where(eq(walletTable.id, walletId));

      await this._addLedgerEntry({
        tx: trx,
        tenantId: wallet.tenantId,
        walletId,

        apiEntityId,
        transactionId,

        reference,

        entryType: 'BLOCK',

        amount: amountInPaise,

        balanceAfter: currentBalance,

        blockedAfter: newBlocked,

        availableAfter: currentBalance - newBlocked,
      });
    };

    if (tx) {
      return executor(tx);
    }

    return db.transaction(executor);
  }

  // RELEASE BLOCKED AMOUNT (amount in paise)
  static async releaseBlockedAmount({
    walletId,
    amount,
    apiEntityId,
    transactionId,
    reference = null,
    tx = null,
  }) {
    const amountInPaise = Number(amount);
    if (amountInPaise <= 0) return;

    const executor = async (trx) => {
      const wallet = await this._getWallet(walletId, trx);

      const currentBlocked = Number(wallet.blockedAmount || 0);

      if (currentBlocked < amountInPaise) {
        console.warn(
          '[WalletService] releaseBlockedAmount skipped',
          wallet.id,
          currentBlocked,
          amountInPaise,
        );
        return;
      }

      const newBlocked = currentBlocked - amountInPaise;

      await trx
        .update(walletTable)
        .set({
          blockedAmount: BigInt(newBlocked),
          updatedAt: new Date(),
        })
        .where(eq(walletTable.id, walletId));

      await this._addLedgerEntry({
        tx: trx,
        tenantId: wallet.tenantId,
        walletId,

        apiEntityId,
        transactionId,

        reference,

        entryType: 'UNBLOCK',

        amount: amountInPaise,

        balanceAfter: Number(wallet.balance),

        blockedAfter: newBlocked,

        availableAfter: Number(wallet.balance) - newBlocked,
      });
    };

    if (tx) {
      return executor(tx);
    }

    return db.transaction(executor);
  }

  // DEBIT BLOCKED AMOUNT (amount in paise)
  static async debitBlockedAmount({
    walletId,
    amount,
    transactionId,
    reference = null,
    tx = null,
  }) {
    const amountInPaise = Number(amount);

    if (amountInPaise <= 0) {
      throw ApiError.badRequest('Invalid debit amount');
    }

    const executor = async (trx) => {
      const wallet = await this._getWallet(walletId, trx);

      const currentBalance = Number(wallet.balance);
      const currentBlocked = Number(wallet.blockedAmount || 0);

      if (currentBlocked < amountInPaise) {
        throw ApiError.badRequest('Blocked amount insufficient');
      }

      if (currentBalance < amountInPaise) {
        throw ApiError.badRequest('Wallet balance insufficient');
      }

      const newBalance = currentBalance - amountInPaise;
      const newBlocked = currentBlocked - amountInPaise;

      await trx
        .update(walletTable)
        .set({
          balance: BigInt(newBalance),
          blockedAmount: BigInt(newBlocked),
          updatedAt: new Date(),
        })
        .where(eq(walletTable.id, walletId));

      await this._addLedgerEntry({
        tx: trx,
        tenantId: wallet.tenantId,
        walletId,

        transactionId,

        reference,

        entryType: 'DEBIT',

        amount: amountInPaise,

        balanceAfter: newBalance,

        blockedAfter: newBlocked,

        availableAfter: newBalance - newBlocked,
      });
    };

    if (tx) {
      return executor(tx);
    }

    return db.transaction(executor);
  }

  // ==================== TDS / GST WALLET CREDIT ====================

  /**
   * Credit TDS to user's TDS wallet (liability tracking)
   */
  static async creditTDSWallet({
    userId,
    tenantId,
    amount,
    transactionId = null,
    reference = null,
    metadata = {},
  }) {
    const tdsWallet = await this.getUserTDSWallet(userId, tenantId);

    if (!tdsWallet) {
      console.warn(`[WalletService] TDS wallet not found for user ${userId}`);
      return null;
    }

    return this.creditWallet({
      walletId: tdsWallet.id,
      amount,
      transactionId,
      reference: reference || `tds_credit_${transactionId}`,
    });
  }

  /**
   * Credit GST to user's GST wallet (liability tracking)
   */
  static async creditGSTWallet({
    userId,
    tenantId,
    amount,
    transactionId = null,
    reference = null,
    metadata = {},
  }) {
    const gstWallet = await this.getUserGSTWallet(userId, tenantId);

    if (!gstWallet) {
      console.warn(`[WalletService] GST wallet not found for user ${userId}`);
      return null;
    }

    return this.creditWallet({
      walletId: gstWallet.id,
      amount,
      transactionId,
      reference: reference || `gst_credit_${transactionId}`,
    });
  }

  // ==================== UTILITY METHODS ====================

  static async getWalletBalanceSummary(walletId) {
    const [wallet] = await db
      .select({
        id: walletTable.id,
        balance: walletTable.balance,
        blockedAmount: walletTable.blockedAmount,
        status: walletTable.status,
      })
      .from(walletTable)
      .where(eq(walletTable.id, walletId))
      .limit(1);

    if (!wallet) {
      return null;
    }

    const balance = Number(wallet.balance);
    const blocked = Number(wallet.blockedAmount || 0);

    return {
      id: wallet.id,
      status: wallet.status,
      balance: wallet.balance,
      blockedAmount: wallet.blockedAmount,
      availableBalance: balance - blocked,
      totalBalance: balance,
      blockedBalance: blocked,
    };
  }

  // Validate wallet balance (amount in paise)
  static async validateWalletBalance(walletId, requiredAmount) {
    const summary = await this.getWalletBalanceSummary(walletId);

    if (!summary) {
      throw ApiError.notFound('Wallet not found');
    }

    if (summary.status !== 'ACTIVE') {
      throw ApiError.badRequest('Wallet is not active');
    }

    const requiredInPaise = Number(requiredAmount);

    if (summary.availableBalance < requiredInPaise) {
      throw ApiError.badRequest(
        `Insufficient balance. Required: ${paiseToRupees(requiredInPaise)}, Available: ${paiseToRupees(summary.availableBalance)}`,
      );
    }

    return true;
  }

  // ==================== CONVENIENCE METHODS (Rupees) ====================

  static async creditWalletRupees({
    walletId,
    amount,
    transactionId = null,
    refundId = null,
    reference = null,
  }) {
    const paise = rupeesToPaise(amount);
    return this.creditWallet({
      walletId,
      amount: paise,
      transactionId,
      refundId,
      reference,
    });
  }

  static async debitWalletRupees({
    walletId,
    amount,
    transactionId = null,
    reference = null,
  }) {
    const paise = rupeesToPaise(amount);
    return this.debitWallet({
      walletId,
      amount: paise,
      transactionId,
      reference,
    });
  }

  static async getWalletBalanceInRupees(walletId) {
    const summary = await this.getWalletBalanceSummary(walletId);
    if (!summary) return null;

    return {
      id: summary.id,
      status: summary.status,
      balance: paiseToRupees(summary.balance),
      blockedAmount: paiseToRupees(summary.blockedAmount),
      availableBalance: paiseToRupees(summary.availableBalance),
      totalBalance: paiseToRupees(summary.totalBalance),
      blockedBalance: paiseToRupees(summary.blockedBalance),
    };
  }
}

export default WalletService;
