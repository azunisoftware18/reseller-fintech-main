import { db } from '../database/core/core-db.js';
import {
  usersTable,
  transactionEarningsTable,
  roleTable,
  walletTable,
} from '../models/core/index.js';
import { eq, and, sql } from 'drizzle-orm';
import crypto from 'crypto';
import WalletService from '../services/wallet.service.js';
import LedgerService from '../services/ledger.service.js';
import CommissionSettingService from '../services/commission-setting.service.js';
import { rupeesToPaise, paiseToRupees } from '../lib/lib.js';

class SurchargeEngine {
  /**
   * Dynamic Entry Surcharge Engine
   *
   * ANY role can be the starting point (payer):
   * - Retailer, Distributor, MasterDist, StateHead, etc.
   * - Whoever transacts = PAYER (margin = 0)
   * - Above hierarchy earns margin (difference)
   * - Below roles are completely ignored
   *
   * GST (3-Level):
   *   - First payer's GST → WhiteLabel's GST wallet
   *   - WhiteLabel GST → Reseller's GST wallet
   *   - Reseller GST → Azzunique's GST wallet
   *
   * TDS (Consolidated):
   *   - All below WhiteLabel → WhiteLabel's TDS wallet
   *   - WhiteLabel → Reseller's TDS wallet
   *   - Reseller → Azzunique's TDS wallet
   *   - Azzunique → Platform (no wallet, just ledger)
   */

  // Get hierarchy chain from CURRENT USER upwards
  static async getUserHierarchyChain(userId, tenantId) {
    const hierarchy = [];
    let currentUserId = userId;
    const visited = new Set();

    while (currentUserId && !visited.has(currentUserId)) {
      visited.add(currentUserId);

      const [user] = await db
        .select({
          id: usersTable.id,
          tenantId: usersTable.tenantId,
          ownerUserId: usersTable.ownerUserId,
          roleId: usersTable.roleId,
          roleName: roleTable.roleName,
          roleLevel: roleTable.roleLevel,
        })
        .from(usersTable)
        .leftJoin(roleTable, eq(usersTable.roleId, roleTable.id))
        .where(eq(usersTable.id, currentUserId))
        .limit(1);

      if (!user) break;

      hierarchy.push({
        userId: user.id,
        tenantId: user.tenantId,
        roleId: user.roleId,
        roleName: user.roleName,
        roleLevel: user.roleLevel,
        level: hierarchy.length,
        ownerUserId: user.ownerUserId,
      });

      currentUserId = user.ownerUserId;
      if (!user.ownerUserId) break;
    }

    return hierarchy;
  }

  // Find consolidation points in hierarchy
  static findConsolidationPoints(hierarchyChain) {
    const whiteLabelIndex = hierarchyChain.findIndex(
      (h) => h.roleName?.toLowerCase().includes('white') || h.level === 4,
    );
    const resellerIndex = hierarchyChain.findIndex(
      (h) => h.roleName?.toLowerCase().includes('reseller') || h.level === 5,
    );
    const azzuniqueIndex = hierarchyChain.findIndex(
      (h) => h.roleName?.toLowerCase().includes('azzunique') || h.level >= 6,
    );

    return { whiteLabelIndex, resellerIndex, azzuniqueIndex };
  }

  /**
   * Calculate surcharge with DYNAMIC ENTRY
   */
  static async calculateSurchargeWithDistribution({
    tenantId,
    userId,
    roleId,
    serviceProviderMappingId,
    amount,
  }) {
    try {
      if (!tenantId || !serviceProviderMappingId || !amount || amount <= 0) {
        return null;
      }

      const hierarchyChain = await this.getUserHierarchyChain(userId, tenantId);
      if (hierarchyChain.length === 0) return null;

      const { whiteLabelIndex, resellerIndex, azzuniqueIndex } =
        this.findConsolidationPoints(hierarchyChain);

      const levelSurcharges = [];
      let previousSurchargeAmount = 0;

      for (let i = 0; i < hierarchyChain.length; i++) {
        const currentLevel = hierarchyChain[i];
        const isFirstLevel = i === 0;

        const surchargeRule = await CommissionSettingService.resolveForUser({
          tenantId: currentLevel.tenantId,
          userId: currentLevel.userId,
          roleId: currentLevel.roleId,
          serviceProviderMappingId,
          amount,
        });

        if (!surchargeRule || surchargeRule.mode !== 'SURCHARGE') {
          continue;
        }

        const amountInPaise = rupeesToPaise(amount);

        let surchargeAmountInPaise = 0;
        if (surchargeRule.type === 'FLAT') {
          surchargeAmountInPaise = rupeesToPaise(surchargeRule.value);
        } else {
          const percentage = parseFloat(surchargeRule.value);
          surchargeAmountInPaise = Math.floor(
            (amountInPaise * percentage) / 100,
          );
        }

        let gstAmountInPaise = 0;
        if (surchargeRule.applyGST && surchargeRule.gstPercent) {
          gstAmountInPaise = Math.floor(
            (surchargeAmountInPaise * surchargeRule.gstPercent) / 100,
          );
        }

        let marginAmountInPaise = 0;
        if (isFirstLevel) {
          marginAmountInPaise = 0;
        } else {
          marginAmountInPaise =
            previousSurchargeAmount - surchargeAmountInPaise;
          if (marginAmountInPaise < 0) marginAmountInPaise = 0;
        }

        let tdsAmountInPaise = 0;
        if (!isFirstLevel && marginAmountInPaise > 0) {
          tdsAmountInPaise = Math.floor((marginAmountInPaise * 2) / 100);
        }

        let tdsReceiverUserId = null;
        let tdsReceiverLevel = null;
        let tdsConsolidationType = null;

        if (!isFirstLevel) {
          if (i < whiteLabelIndex && whiteLabelIndex !== -1) {
            const whiteLabel = hierarchyChain[whiteLabelIndex];
            tdsReceiverUserId = whiteLabel.userId;
            tdsReceiverLevel = 'White Label';
            tdsConsolidationType = 'CONSOLIDATED_TO_WHITELABEL';
          } else if (i === whiteLabelIndex && resellerIndex !== -1) {
            const reseller = hierarchyChain[resellerIndex];
            tdsReceiverUserId = reseller.userId;
            tdsReceiverLevel = 'Reseller';
            tdsConsolidationType = 'WHITELABEL_TO_RESELLER';
          } else if (i === resellerIndex && azzuniqueIndex !== -1) {
            const azzunique = hierarchyChain[azzuniqueIndex];
            tdsReceiverUserId = azzunique.userId;
            tdsReceiverLevel = 'Azzunique';
            tdsConsolidationType = 'RESELLER_TO_AZZUNIQUE';
          } else if (i === azzuniqueIndex) {
            tdsReceiverUserId = null;
            tdsReceiverLevel = 'Platform';
            tdsConsolidationType = 'AZZUNIQUE_TO_PLATFORM';
          }
        }

        let gstReceiverUserId = null;
        let gstReceiverLevel = null;
        let gstCutType = null;

        if (isFirstLevel) {
          if (whiteLabelIndex !== -1) {
            const whiteLabel = hierarchyChain[whiteLabelIndex];
            gstReceiverUserId = whiteLabel.userId;
            gstReceiverLevel = 'White Label';
            gstCutType = 'USER_GST';
          }
        } else if (i === whiteLabelIndex) {
          if (resellerIndex !== -1) {
            const reseller = hierarchyChain[resellerIndex];
            gstReceiverUserId = reseller.userId;
            gstReceiverLevel = 'Reseller';
            gstCutType = 'WHITELABEL_GST';
          }
        } else if (i === resellerIndex) {
          if (azzuniqueIndex !== -1) {
            const azzunique = hierarchyChain[azzuniqueIndex];
            gstReceiverUserId = azzunique.userId;
            gstReceiverLevel = 'Azzunique';
            gstCutType = 'RESELLER_GST';
          }
        }

        const netDeductionInPaise = isFirstLevel
          ? surchargeAmountInPaise + gstAmountInPaise
          : 0;

        levelSurcharges.push({
          level: i,
          levelName: this.getLevelName(currentLevel.roleLevel, i),
          userId: currentLevel.userId,
          tenantId: currentLevel.tenantId,
          roleId: currentLevel.roleId,
          roleName: currentLevel.roleName,
          surchargeRuleId: surchargeRule.id,
          type: surchargeRule.type,
          value: surchargeRule.value,

          surchargeAmount: surchargeAmountInPaise,
          previousSurchargeAmount: previousSurchargeAmount,
          marginAmount: marginAmountInPaise,
          isPayer: isFirstLevel,

          gstAmount: gstAmountInPaise,
          gstReceiverUserId: gstReceiverUserId,
          gstReceiverLevel: gstReceiverLevel,
          gstCutType: gstCutType,
          applyGST: surchargeRule.applyGST,
          gstPercent: surchargeRule.gstPercent,

          tdsAmount: tdsAmountInPaise,
          tdsReceiverUserId: tdsReceiverUserId,
          tdsReceiverLevel: tdsReceiverLevel,
          tdsConsolidationType: tdsConsolidationType,

          netDeduction: netDeductionInPaise,
          appliedSlab: surchargeRule.appliedSlab || null,
        });

        previousSurchargeAmount = surchargeAmountInPaise;
      }

      if (levelSurcharges.length === 0) return null;

      const payerLevel = levelSurcharges[0];
      const totals = {
        totalSurcharge: payerLevel?.surchargeAmount || 0,
        totalGST: levelSurcharges.reduce(
          (sum, item) => sum + item.gstAmount,
          0,
        ),
        totalTDS: levelSurcharges.reduce(
          (sum, item) => sum + item.tdsAmount,
          0,
        ),
        totalMargin: levelSurcharges.reduce(
          (sum, item) => sum + item.marginAmount,
          0,
        ),
        totalNetDeduction: payerLevel?.netDeduction || 0,

        userGST: payerLevel?.gstAmount || 0,
        whiteLabelGST:
          levelSurcharges.find((l) => l.gstCutType === 'WHITELABEL_GST')
            ?.gstAmount || 0,
        resellerGST:
          levelSurcharges.find((l) => l.gstCutType === 'RESELLER_GST')
            ?.gstAmount || 0,

        tdsToWhiteLabel: levelSurcharges
          .filter(
            (l) => l.tdsConsolidationType === 'CONSOLIDATED_TO_WHITELABEL',
          )
          .reduce((sum, l) => sum + l.tdsAmount, 0),
        tdsToReseller: levelSurcharges
          .filter((l) => l.tdsConsolidationType === 'WHITELABEL_TO_RESELLER')
          .reduce((sum, l) => sum + l.tdsAmount, 0),
        tdsToAzzunique: levelSurcharges
          .filter((l) => l.tdsConsolidationType === 'RESELLER_TO_AZZUNIQUE')
          .reduce((sum, l) => sum + l.tdsAmount, 0),
      };

      return { success: true, levelSurcharges, totals, payerUserId: userId };
    } catch (error) {
      console.error('Error calculating surcharge:', error);
      return null;
    }
  }

  static getLevelName(roleLevel, index) {
    const names = [
      'Retailer',
      'Distributor',
      'Master Distributor',
      'State Head',
      'White Label',
      'Reseller',
      'Azzunique',
    ];
    return names[index] || `Level ${index}`;
  }

  /**
   * Block surcharge from PAYER's MAIN wallet
   */
  static async blockSurchargeWithDistribution({
    walletId,
    surchargeData,
    transactionId,
    userId,
    tenantId,
    serviceId,
  }) {
    const { levelSurcharges, totals, payerUserId } = surchargeData;

    if (totals.totalNetDeduction <= 0) {
      return {
        success: true,
        blocked: false,
        reason: 'No surcharge applicable',
      };
    }

    return await db.transaction(async (tx) => {
      const existing = await tx
        .select()
        .from(transactionEarningsTable)
        .where(
          and(
            eq(transactionEarningsTable.transactionId, transactionId),
            eq(transactionEarningsTable.mode, 'SURCHARGE'),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        return {
          success: true,
          alreadyProcessed: true,
          earningId: existing[0].id,
        };
      }

      const [wallet] = await tx
        .select({ balance: walletTable.balance })
        .from(walletTable)
        .where(
          and(eq(walletTable.id, walletId), eq(walletTable.tenantId, tenantId)),
        )
        .limit(1);

      if (!wallet) throw new Error('Payer wallet not found');

      // ✅ Block from PAYER's MAIN wallet
      await WalletService.blockAmount({
        walletId,
        amount: totals.totalNetDeduction,
        transactionId,
        reference: `surcharge_block_${transactionId}`,
        tx,
      });

      const now = new Date();
      const earningIds = [];

      for (const level of levelSurcharges) {
        const earningId = crypto.randomUUID();
        earningIds.push(earningId);

        let valueToStore;
        if (level.type === 'FLAT') {
          valueToStore = BigInt(rupeesToPaise(level.value));
        } else {
          valueToStore = BigInt(Math.round(parseFloat(level.value) * 100));
        }

        const metadata = {
          level: level.level,
          levelName: level.levelName,
          roleName: level.roleName,
          ruleId: level.surchargeRuleId,
          isPayer: level.isPayer,

          gstAmount: level.gstAmount,
          gstReceiverUserId: level.gstReceiverUserId,
          gstReceiverLevel: level.gstReceiverLevel,
          gstCutType: level.gstCutType,

          tdsAmount: level.tdsAmount,
          tdsReceiverUserId: level.tdsReceiverUserId,
          tdsReceiverLevel: level.tdsReceiverLevel,
          tdsConsolidationType: level.tdsConsolidationType,

          surchargeAmount: level.surchargeAmount,
          marginAmount: level.marginAmount,
          previousSurchargeAmount: level.previousSurchargeAmount,
        };

        await tx.insert(transactionEarningsTable).values({
          id: earningId,
          userId: level.userId,
          tenantId: level.tenantId,
          walletId: level.isPayer ? walletId : null,
          transactionId,
          serviceId,
          mode: 'SURCHARGE',
          type: level.type,
          value: valueToStore,
          baseAmount: BigInt(level.surchargeAmount),
          gstAmount: BigInt(level.gstAmount),
          tdsAmount: BigInt(level.tdsAmount),
          finalAmount: BigInt(
            level.isPayer
              ? level.netDeduction
              : level.marginAmount - level.tdsAmount,
          ),
          status: 'BLOCKED',
          appliedSlabMin: level.appliedSlab?.minAmount
            ? BigInt(rupeesToPaise(level.appliedSlab.minAmount))
            : null,
          appliedSlabMax: level.appliedSlab?.maxAmount
            ? BigInt(rupeesToPaise(level.appliedSlab.maxAmount))
            : null,
          metadata: metadata,
          createdAt: now,
          updatedAt: now,
        });
      }

      return {
        success: true,
        blocked: true,
        earningIds,
        totalAmount: paiseToRupees(totals.totalNetDeduction),
        payerUserId,
      };
    });
  }

  /**
   * Commit surcharge - Distribute margins to MAIN wallet, TDS/GST to respective wallets
   */
  static async commitSurchargeWithDistribution({
    walletId,
    surchargeData,
    transactionId,
    userId,
    tenantId,
  }) {
    const { levelSurcharges, totals, payerUserId } = surchargeData;

    if (totals.totalNetDeduction <= 0) return;

    await db.transaction(async (tx) => {
      const now = new Date();

      const surchargeRecords = await tx
        .select()
        .from(transactionEarningsTable)
        .where(
          and(
            eq(transactionEarningsTable.transactionId, transactionId),
            eq(transactionEarningsTable.mode, 'SURCHARGE'),
            eq(transactionEarningsTable.status, 'BLOCKED'),
          ),
        );

      if (surchargeRecords.length === 0) return;

      for (const record of surchargeRecords) {
        const meta = record.metadata;

        // ✅ PAYER: Debit blocked amount from MAIN wallet
        if (meta?.isPayer) {
          await WalletService.debitBlockedAmount({
            walletId: record.walletId,
            amount: Number(record.baseAmount) + Number(record.gstAmount),
            transactionId,
            reference: `surcharge_debit_${transactionId}_${record.id}`,
            tx,
          });
        }

        // ✅ EARNING LEVELS: Credit margin to their MAIN wallet
        if (!meta?.isPayer && meta?.marginAmount > 0) {
          const [levelMainWallet] = await tx
            .select({ id: walletTable.id, balance: walletTable.balance })
            .from(walletTable)
            .where(
              and(
                eq(walletTable.ownerId, record.userId),
                eq(walletTable.tenantId, record.tenantId),
                eq(walletTable.walletType, 'MAIN'),
              ),
            )
            .limit(1);

          if (levelMainWallet) {
            const netMargin =
              Number(meta.marginAmount) - Number(record.tdsAmount || 0);

            if (netMargin > 0) {
              await WalletService.creditWallet({
                walletId: levelMainWallet.id,
                amount: netMargin,
                transactionId,
                reference: `surcharge_margin_${transactionId}_${record.id}`,
                tx,
              });
            }
          }
        }

        // ✅ TDS - Credit to receiver's TDS wallet (liability)
        if (meta?.tdsAmount > 0 && meta?.tdsReceiverUserId) {
          const receiverTDSWallet = await WalletService.getUserTDSWallet(
            meta.tdsReceiverUserId,
            tenantId,
          );

          if (receiverTDSWallet) {
            await WalletService.creditWallet({
              walletId: receiverTDSWallet.id,
              amount: Number(record.tdsAmount),
              transactionId,
              reference: `tds_liability_${transactionId}_${record.id}`,
              tx,
            });

            await LedgerService.createEntry({
              tenantId,
              walletId: receiverTDSWallet.id,
              transactionId,
              reference: `tds_liability_${transactionId}_${record.id}`,
              entryType: 'TDS_LIABILITY',
              amount: Number(record.tdsAmount),
              balanceAfter: 0,
              metadata: {
                type: 'TDS_COLLECTED_FROM_CHILD',
                fromUserId: record.userId,
                fromLevel: meta.levelName,
                toLevel: meta.tdsReceiverLevel,
                marginAmount: meta.marginAmount,
                tdsRate: '2%',
                note: `TDS 2% on margin stored in TDS wallet. Must pay to government.`,
              },
              tx,
            });
          } else {
            console.warn(
              `[SurchargeEngine] TDS wallet not found for receiver ${meta.tdsReceiverUserId}`,
            );
          }

          await tx
            .update(transactionEarningsTable)
            .set({
              metadata: sql`JSON_SET(
                COALESCE(metadata, '{}'), 
                '$.tdsLiability', true,
                '$.tdsLiabilityAmount', ${record.tdsAmount},
                '$.tdsCollectedFrom', ${record.userId},
                '$.tdsPayableToGovt', true,
                '$.tdsReceiverUserId', ${meta.tdsReceiverUserId}
              )`,
            })
            .where(eq(transactionEarningsTable.id, record.id));
        }

        // ✅ GST - Credit to receiver's GST wallet (liability)
        if (meta?.gstAmount > 0 && meta?.gstReceiverUserId) {
          const receiverGSTWallet = await WalletService.getUserGSTWallet(
            meta.gstReceiverUserId,
            tenantId,
          );

          if (receiverGSTWallet) {
            await WalletService.creditWallet({
              walletId: receiverGSTWallet.id,
              amount: Number(record.gstAmount),
              transactionId,
              reference: `gst_liability_${transactionId}_${record.id}`,
              tx,
            });

            await LedgerService.createEntry({
              tenantId,
              walletId: receiverGSTWallet.id,
              transactionId,
              reference: `gst_liability_${transactionId}_${record.id}`,
              entryType: 'GST_LIABILITY',
              amount: Number(record.gstAmount),
              balanceAfter: 0,
              metadata: {
                type: 'GST_COLLECTED_FROM_SURCHARGE',
                gstCutType: meta.gstCutType,
                fromUserId: record.userId,
                fromLevel: meta.levelName,
                toLevel: meta.gstReceiverLevel,
                note: 'GST on surcharge stored in GST wallet. Must pay to government.',
              },
              tx,
            });
          } else {
            console.warn(
              `[SurchargeEngine] GST wallet not found for receiver ${meta.gstReceiverUserId}`,
            );
          }

          await tx
            .update(transactionEarningsTable)
            .set({
              metadata: sql`JSON_SET(
                COALESCE(metadata, '{}'), 
                '$.gstLiability', true,
                '$.gstLiabilityAmount', ${record.gstAmount},
                '$.gstCollectedFrom', ${record.userId},
                '$.gstPayableToGovt', true,
                '$.gstReceiverUserId', ${meta.gstReceiverUserId}
              )`,
            })
            .where(eq(transactionEarningsTable.id, record.id));
        }
      }

      // Update all records to COMPLETED
      await tx
        .update(transactionEarningsTable)
        .set({ status: 'COMPLETED', updatedAt: now })
        .where(
          and(
            eq(transactionEarningsTable.transactionId, transactionId),
            eq(transactionEarningsTable.mode, 'SURCHARGE'),
          ),
        );
    });
  }

  /**
   * Release blocked surcharge (rollback)
   */
  static async releaseSurchargeWithDistribution({
    walletId,
    surchargeData,
    transactionId,
    userId,
    tenantId,
    reason = 'TRANSACTION_FAILED',
  }) {
    const { totals } = surchargeData;

    if (totals.totalNetDeduction <= 0) return;

    await db.transaction(async (tx) => {
      const now = new Date();

      await tx
        .update(transactionEarningsTable)
        .set({
          status: 'RELEASED',
          metadata: sql`JSON_SET(COALESCE(metadata, '{}'), '$.releaseReason', ${reason})`,
          updatedAt: now,
        })
        .where(
          and(
            eq(transactionEarningsTable.transactionId, transactionId),
            eq(transactionEarningsTable.mode, 'SURCHARGE'),
          ),
        );

      const [wallet] = await tx
        .select({ balance: walletTable.balance })
        .from(walletTable)
        .where(
          and(eq(walletTable.id, walletId), eq(walletTable.tenantId, tenantId)),
        )
        .limit(1);

      await WalletService.releaseBlockedAmount({
        walletId,
        amount: totals.totalNetDeduction,
        transactionId,
        reference: `surcharge_release_${transactionId}`,
        tx,
      });
    });
  }

  /**
   * Complete surcharge flow
   */
  static async processSurcharge({
    tenantId,
    userId,
    roleId,
    serviceProviderMappingId,
    amount,
    transactionId,
    walletId,
    serviceId,
    autoCommit = false,
  }) {
    const surchargeData = await this.calculateSurchargeWithDistribution({
      tenantId,
      userId,
      roleId,
      serviceProviderMappingId,
      amount,
    });

    if (!surchargeData) return null;

    const blockResult = await this.blockSurchargeWithDistribution({
      walletId,
      surchargeData,
      transactionId,
      userId,
      tenantId,
      serviceId,
    });

    if (!blockResult.success) return blockResult;

    if (autoCommit) {
      await this.commitSurchargeWithDistribution({
        walletId,
        surchargeData,
        transactionId,
        userId,
        tenantId,
      });
    }

    return {
      ...surchargeData,
      totals: {
        ...surchargeData.totals,
        totalNetDeductionInRupees: paiseToRupees(
          surchargeData.totals.totalNetDeduction,
        ),
        totalSurchargeInRupees: paiseToRupees(
          surchargeData.totals.totalSurcharge,
        ),
        totalGSTInRupees: paiseToRupees(surchargeData.totals.totalGST),
        totalTDSInRupees: paiseToRupees(surchargeData.totals.totalTDS),
        totalMarginInRupees: paiseToRupees(surchargeData.totals.totalMargin),
        userGSTInRupees: paiseToRupees(surchargeData.totals.userGST),
        whiteLabelGSTInRupees: paiseToRupees(
          surchargeData.totals.whiteLabelGST,
        ),
        resellerGSTInRupees: paiseToRupees(surchargeData.totals.resellerGST),
        tdsToWhiteLabelInRupees: paiseToRupees(
          surchargeData.totals.tdsToWhiteLabel,
        ),
        tdsToResellerInRupees: paiseToRupees(
          surchargeData.totals.tdsToReseller,
        ),
        tdsToAzzuniqueInRupees: paiseToRupees(
          surchargeData.totals.tdsToAzzunique,
        ),
      },
      blockResult,
    };
  }

  /**
   * Get TDS Liability Report
   */
  static async getTDSLiabilityReport(
    userId,
    tenantId,
    startDate = null,
    endDate = null,
  ) {
    let query = db
      .select()
      .from(transactionEarningsTable)
      .where(
        and(
          eq(transactionEarningsTable.tenantId, tenantId),
          eq(transactionEarningsTable.mode, 'SURCHARGE'),
          eq(transactionEarningsTable.status, 'COMPLETED'),
        ),
      );

    if (startDate) {
      query = query.where(
        sql`${transactionEarningsTable.createdAt} >= ${startDate}`,
      );
    }
    if (endDate) {
      query = query.where(
        sql`${transactionEarningsTable.createdAt} <= ${endDate}`,
      );
    }

    const entries = await query;

    let totalTDSCollected = 0;
    const tdsDetails = [];

    entries.forEach((entry) => {
      const meta = entry.metadata || {};
      if (meta.tdsReceiverUserId === userId && meta.tdsAmount) {
        totalTDSCollected += Number(meta.tdsAmount);
        tdsDetails.push({
          transactionId: entry.transactionId,
          tdsAmount: paiseToRupees(meta.tdsAmount),
          fromUserId: entry.userId,
          fromLevel: meta.levelName,
          marginAmount: paiseToRupees(meta.marginAmount || 0),
          date: entry.createdAt,
        });
      }
    });

    return {
      userId,
      reportType: 'SURCHARGE_TDS_LIABILITY',
      period: { startDate, endDate },
      totalTDSCollected: paiseToRupees(totalTDSCollected),
      pendingTDS: paiseToRupees(totalTDSCollected),
      tdsEntries: tdsDetails,
      note: 'TDS collected from margin on surcharge - LIABILITY must be paid to government',
    };
  }

  /**
   * Get Tax Liability Report (TDS + GST)
   */
  static async getTaxLiabilityReport(
    userId,
    tenantId,
    startDate = null,
    endDate = null,
  ) {
    let query = db
      .select()
      .from(transactionEarningsTable)
      .where(
        and(
          eq(transactionEarningsTable.tenantId, tenantId),
          eq(transactionEarningsTable.mode, 'SURCHARGE'),
          eq(transactionEarningsTable.status, 'COMPLETED'),
        ),
      );

    if (startDate) {
      query = query.where(
        sql`${transactionEarningsTable.createdAt} >= ${startDate}`,
      );
    }
    if (endDate) {
      query = query.where(
        sql`${transactionEarningsTable.createdAt} <= ${endDate}`,
      );
    }

    const entries = await query;

    let totalTDSCollected = 0;
    let totalGSTCollected = 0;
    const tdsDetails = [];
    const gstDetails = [];

    entries.forEach((entry) => {
      const meta = entry.metadata || {};

      if (meta.tdsReceiverUserId === userId && meta.tdsAmount) {
        totalTDSCollected += Number(meta.tdsAmount);
        tdsDetails.push({
          transactionId: entry.transactionId,
          taxType: 'TDS',
          amount: paiseToRupees(meta.tdsAmount),
          fromUserId: entry.userId,
          fromLevel: meta.levelName,
          baseAmount: paiseToRupees(meta.marginAmount || 0),
          taxRate: '2%',
          date: entry.createdAt,
          isLiability: true,
        });
      }

      if (meta.gstReceiverUserId === userId && meta.gstAmount) {
        totalGSTCollected += Number(meta.gstAmount);
        gstDetails.push({
          transactionId: entry.transactionId,
          taxType: 'GST',
          amount: paiseToRupees(meta.gstAmount),
          fromUserId: entry.userId,
          fromLevel: meta.levelName,
          baseAmount: paiseToRupees(meta.surchargeAmount || 0),
          taxRate: `${meta.gstPercent}%`,
          date: entry.createdAt,
          isLiability: true,
        });
      }
    });

    const totalTaxLiability = totalTDSCollected + totalGSTCollected;

    return {
      userId,
      reportType: 'SURCHARGE_TAX_LIABILITY',
      period: { startDate, endDate },
      summary: {
        totalTDSCollected: paiseToRupees(totalTDSCollected),
        totalGSTCollected: paiseToRupees(totalGSTCollected),
        totalTaxLiability: paiseToRupees(totalTaxLiability),
      },
      pendingTax: paiseToRupees(totalTaxLiability),
      tdsEntries: tdsDetails,
      gstEntries: gstDetails,
      note: 'TDS and GST collected from surcharge - LIABILITY must be paid to government',
    };
  }
}

export default SurchargeEngine;
