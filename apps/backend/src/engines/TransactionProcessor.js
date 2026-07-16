import { db } from '../database/core/core-db.js';
import { usersTable } from '../models/core/index.js';
import { eq } from 'drizzle-orm';
import { ApiError } from '../lib/ApiError.js';
import SurchargeEngine from './surcharge.engine.js';
import MultiLevelCommissionEngine from './multilevel-commission.engine.js';
import WalletService from '../services/wallet.service.js';

class TransactionProcessor {
  static async calculateSurcharge({
    tenantId,
    userId,
    roleId,
    serviceProviderMappingId,
    amount,
  }) {
    try {
      const surchargeData =
        await SurchargeEngine.calculateSurchargeWithDistribution({
          tenantId,
          userId,
          roleId,
          serviceProviderMappingId,
          amount,
        });

      return {
        success: true,
        surcharge: surchargeData,
        totalDeduction: surchargeData?.totals?.totalNetDeduction || 0,
        breakdown: surchargeData?.levelSurcharges || [],
      };
    } catch (error) {
      console.error('Surcharge calculation error:', error);
      throw ApiError.badRequest(
        `Surcharge calculation failed: ${error.message}`,
      );
    }
  }

  static async blockSurcharge({
    walletId,
    surchargeData,
    transactionId,
    userId,
    tenantId,
    serviceId,
  }) {
    try {
      if (!surchargeData || surchargeData.totals.totalNetDeduction <= 0) {
        return {
          success: true,
          blocked: false,
          reason: 'No surcharge applicable',
        };
      }

      const result = await SurchargeEngine.blockSurchargeWithDistribution({
        walletId,
        surchargeData,
        transactionId,
        userId,
        tenantId,
        serviceId,
      });

      return {
        success: true,
        blocked: true,
        earningIds: result.earningIds,
        totalBlocked: result.totalAmount,
      };
    } catch (error) {
      console.error('Surcharge block error:', error);
      throw ApiError.badRequest(`Failed to block surcharge: ${error.message}`);
    }
  }

  static async commitSurcharge({
    walletId,
    surchargeData,
    transactionId,
    userId,
    tenantId,
  }) {
    try {
      if (!surchargeData || surchargeData.totals.totalNetDeduction <= 0) {
        return {
          success: true,
          committed: false,
          reason: 'No surcharge to commit',
        };
      }

      await SurchargeEngine.commitSurchargeWithDistribution({
        walletId,
        surchargeData,
        transactionId,
        userId,
        tenantId,
      });

      return {
        success: true,
        committed: true,
        totalCommitted: surchargeData.totals.totalNetDeduction,
        gstBreakdown: {
          userGST: surchargeData.totals.userGST,
          whiteLabelGST: surchargeData.totals.whiteLabelGST,
          resellerGST: surchargeData.totals.resellerGST,
        },
        tdsBreakdown: {
          toWhiteLabel: surchargeData.totals.tdsToWhiteLabel,
          toReseller: surchargeData.totals.tdsToReseller,
          toAzzunique: surchargeData.totals.tdsToAzzunique,
        },
      };
    } catch (error) {
      console.error('Surcharge commit error:', error);
      throw ApiError.badRequest(`Failed to commit surcharge: ${error.message}`);
    }
  }

  static async releaseSurcharge({
    walletId,
    surchargeData,
    transactionId,
    userId,
    tenantId,
    reason = 'TRANSACTION_FAILED',
  }) {
    try {
      if (!surchargeData || surchargeData.totals.totalNetDeduction <= 0) {
        return {
          success: true,
          released: false,
          reason: 'No surcharge to release',
        };
      }

      await SurchargeEngine.releaseSurchargeWithDistribution({
        walletId,
        surchargeData,
        transactionId,
        userId,
        tenantId,
        reason,
      });

      return {
        success: true,
        released: true,
        totalReleased: surchargeData.totals.totalNetDeduction,
        reason,
      };
    } catch (error) {
      console.error('Surcharge release error:', error);
      throw ApiError.badRequest(
        `Failed to release surcharge: ${error.message}`,
      );
    }
  }

  static async processTransaction({
    tenantId,
    userId,
    roleId,
    serviceProviderMappingId,
    transactionAmount,
    transactionId,
    serviceId,
    walletId,
    providerMargin = 0,
    maxDepth = 6,
    skipSurcharge = false,
    skipCommission = false,
  }) {
    const results = {
      success: false,
      surcharge: null,
      commission: null,
      errors: [],
    };

    return await db.transaction(async (tx) => {
      try {
        let surchargeData = null;
        let surchargeBlockResult = null;

        if (!skipSurcharge) {
          const amountInRupees = transactionAmount / 100;

          surchargeData =
            await SurchargeEngine.calculateSurchargeWithDistribution({
              tenantId,
              userId,
              roleId,
              serviceProviderMappingId,
              amount: amountInRupees,
            });

          if (surchargeData && surchargeData.totals?.totalNetDeduction > 0) {
            surchargeBlockResult =
              await SurchargeEngine.blockSurchargeWithDistribution({
                walletId,
                surchargeData,
                transactionId,
                userId,
                tenantId,
                serviceId,
              });

            results.surcharge = {
              calculated: true,
              blocked: true,
              totalDeduction: surchargeData.totals.totalNetDeduction,
              breakdown: surchargeData.levelSurcharges,
              earningIds: surchargeBlockResult.earningIds,
            };
          } else {
            results.surcharge = {
              calculated: true,
              blocked: false,
              reason: 'No surcharge applicable',
            };
          }
        }

        if (!skipSurcharge && surchargeData?.totals?.totalNetDeduction > 0) {
          await SurchargeEngine.commitSurchargeWithDistribution({
            walletId,
            surchargeData,
            transactionId,
            userId,
            tenantId,
          });

          results.surcharge.committed = true;
          results.surcharge.gstLiability = {
            userGST: surchargeData.totals.userGST,
            whiteLabelGST: surchargeData.totals.whiteLabelGST,
            resellerGST: surchargeData.totals.resellerGST,
          };
          results.surcharge.tdsLiability = {
            toWhiteLabel: surchargeData.totals.tdsToWhiteLabel,
            toReseller: surchargeData.totals.tdsToReseller,
            toAzzunique: surchargeData.totals.tdsToAzzunique,
          };
        }

        if (!skipCommission) {
          const [user] = await tx
            .select()
            .from(usersTable)
            .where(eq(usersTable.id, userId))
            .limit(1);

          if (!user) {
            throw ApiError.notFound('User not found for commission processing');
          }

          const commissionResult = await MultiLevelCommissionEngine.process({
            transaction: {
              id: transactionId,
              tenantId,
              amount: transactionAmount,
              serviceId,
              serviceProviderMappingId,
            },
            user,
            providerMargin,
            maxDepth,
            tx,
          });

          results.commission = commissionResult;
        }

        results.success = true;
        return results;
      } catch (error) {
        console.error('Transaction processing error:', error);
        results.errors.push(error.message);
        throw error;
      }
    });
  }

  static async processSurchargeAndCommission({
    tenantId,
    userId,
    roleId,
    serviceProviderMappingId,
    transactionAmount,
    transactionId,
    serviceId,
    walletId,
    providerMargin = 0,
    maxDepth = 6,
    skipSurcharge = false,
    skipCommission = false,
  }) {
    return await this.processTransaction({
      tenantId,
      userId,
      roleId,
      serviceProviderMappingId,
      transactionAmount,
      transactionId,
      serviceId,
      walletId,
      providerMargin,
      maxDepth,
      skipSurcharge,
      skipCommission,
    });
  }
}

export default TransactionProcessor;
