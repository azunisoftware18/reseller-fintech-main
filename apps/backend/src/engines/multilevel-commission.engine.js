import { db } from '../database/core/core-db.js';
import { usersTable, transactionEarningsTable } from '../models/core/index.js';
import { eq, and, sql } from 'drizzle-orm';
import crypto from 'crypto';
import WalletService from '../services/wallet.service.js';
import LedgerService from '../services/ledger.service.js';
import CommissionSettingService from '../services/commission-setting.service.js';
import { rupeesToPaise, paiseToRupees } from '../lib/lib.js';

class MultiLevelCommissionEngine {
  static async process({
    transaction,
    user,
    providerMargin,
    maxDepth = 6,
    tx = null,
  }) {
    const results = {
      processed: [],
      skipped: [],
      totalCommissionDistributed: 0,
      totalTDSCollected: 0,
      depthReached: 0,
    };

    if (!transaction?.id || !transaction?.amount) {
      throw new Error('Transaction with id and amount is required');
    }
    if (!user?.id || !user?.tenantId || !user?.roleId) {
      throw new Error('User with id, tenantId and roleId is required');
    }
    if (
      providerMargin === undefined ||
      providerMargin === null ||
      providerMargin < 0
    ) {
      throw new Error('Provider margin is required (in rupees)');
    }

    const dbClient = tx || db;
    let currentUser = user;
    let depth = 0;
    const visited = new Set();
    visited.add(user.id);

    const totalProviderMargin = rupeesToPaise(providerMargin);

    while (currentUser.ownerUserId && depth < maxDepth) {
      try {
        if (visited.has(currentUser.ownerUserId)) {
          results.skipped.push({
            userId: currentUser.ownerUserId,
            reason: 'Cycle detected in hierarchy',
            depth: depth + 1,
          });
          break;
        }

        const [parentUser] = await dbClient
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, currentUser.ownerUserId))
          .limit(1);

        if (!parentUser) {
          results.skipped.push({
            userId: currentUser.ownerUserId,
            reason: 'Parent user not found',
            depth: depth + 1,
          });
          break;
        }

        visited.add(parentUser.id);

        const commissionRule = await CommissionSettingService.resolveForUser({
          tenantId: currentUser.tenantId,
          userId: currentUser.id,
          roleId: currentUser.roleId,
          serviceProviderMappingId: transaction.serviceProviderMappingId,
          amount: providerMargin,
        });

        if (!commissionRule || commissionRule.mode !== 'COMMISSION') {
          results.skipped.push({
            userId: currentUser.id,
            roleId: currentUser.roleId,
            reason: 'No commission rule found for this user/role',
            depth: depth + 1,
          });
          currentUser = parentUser;
          depth++;
          continue;
        }

        let grossCommission = 0;
        if (commissionRule.type === 'FLAT') {
          grossCommission = rupeesToPaise(commissionRule.value);
        } else {
          grossCommission = Math.floor(
            (totalProviderMargin * commissionRule.value) / 100,
          );
        }

        if (grossCommission <= 0) {
          results.skipped.push({
            userId: currentUser.id,
            reason: `Gross commission zero. Provider margin: ${providerMargin}, Rule: ${commissionRule.value}%`,
            depth: depth + 1,
          });
          currentUser = parentUser;
          depth++;
          continue;
        }

        const tdsAmount = Math.floor((grossCommission * 2) / 100);
        const netCommission = grossCommission - tdsAmount;

        // ✅ Get child's MAIN wallet for commission credit
        const childMainWallet = await WalletService.getUserMainWallet(
          currentUser.id,
          currentUser.tenantId,
        );

        if (!childMainWallet) {
          results.skipped.push({
            userId: currentUser.id,
            reason: 'Child MAIN wallet not found',
            depth: depth + 1,
          });
          currentUser = parentUser;
          depth++;
          continue;
        }

        const [existingEarning] = await dbClient
          .select({ id: transactionEarningsTable.id })
          .from(transactionEarningsTable)
          .where(
            and(
              eq(transactionEarningsTable.transactionId, transaction.id),
              eq(transactionEarningsTable.userId, currentUser.id),
              eq(transactionEarningsTable.mode, 'COMMISSION'),
            ),
          )
          .limit(1);

        if (existingEarning) {
          results.skipped.push({
            userId: currentUser.id,
            reason: 'Commission already processed for this user',
            depth: depth + 1,
            earningId: existingEarning.id,
          });
          currentUser = parentUser;
          depth++;
          continue;
        }

        const earningId = crypto.randomUUID();
        const now = new Date();

        // ✅ CREDIT NET COMMISSION TO CHILD'S MAIN WALLET
        if (netCommission > 0) {
          await WalletService.creditWallet({
            walletId: childMainWallet.id,
            amount: netCommission,
            transactionId: transaction.id,
            reference: `comm_net_${transaction.id}_${depth}`,
            tx,
          });
        }

        // ✅ CREDIT TDS TO PARENT'S TDS WALLET (liability)
        if (tdsAmount > 0 && parentUser) {
          const parentTDSWallet = await WalletService.getUserTDSWallet(
            parentUser.id,
            parentUser.tenantId,
          );

          if (parentTDSWallet) {
            await WalletService.creditWallet({
              walletId: parentTDSWallet.id,
              amount: tdsAmount,
              transactionId: transaction.id,
              reference: `tds_collect_${transaction.id}_${depth}`,
              tx,
            });

            // Ledger: TDS liability in TDS wallet
            await LedgerService.createEntry({
              tenantId: parentUser.tenantId,
              walletId: parentTDSWallet.id,
              transactionId: transaction.id,
              reference: `tds_liability_${transaction.id}_${depth}`,
              entryType: 'TDS_LIABILITY',
              amount: tdsAmount,
              balanceAfter: 0,
              metadata: {
                type: 'TDS_COLLECTED_FROM_CHILD',
                fromUserId: currentUser.id,
                fromUserRole: currentUser.roleId,
                commissionAmount: grossCommission,
                tdsRate: '2%',
                note: `TDS 2% collected from ${currentUser.id} on commission payout. Stored in TDS wallet (liability).`,
              },
              tx: dbClient,
            });
          } else {
            console.warn(
              `[CommissionEngine] Parent ${parentUser.id} has no TDS wallet. TDS ${tdsAmount} paise not credited.`,
            );
          }
        }

        // Ledger: TDS paid by child (debit from commission)
        if (tdsAmount > 0) {
          await LedgerService.createEntry({
            tenantId: currentUser.tenantId,
            walletId: childMainWallet.id,
            transactionId: transaction.id,
            reference: `tds_paid_${transaction.id}_${depth}`,
            entryType: 'TDS_PAID',
            amount: tdsAmount,
            balanceAfter: 0,
            metadata: {
              type: 'TDS_PAID_TO_PARENT',
              toUserId: parentUser.id,
              toUserRole: parentUser.roleId,
              tdsAmount,
              note: 'TDS 2% deducted from commission and paid to parent TDS wallet.',
            },
            tx: dbClient,
          });
        }

        await dbClient.insert(transactionEarningsTable).values({
          id: earningId,
          userId: currentUser.id,
          tenantId: currentUser.tenantId,
          walletId: childMainWallet.id,
          transactionId: transaction.id,
          serviceId: transaction.serviceId || null,
          mode: 'COMMISSION',
          type: commissionRule.type,
          value: BigInt(rupeesToPaise(commissionRule.value)),
          baseAmount: BigInt(grossCommission),
          gstAmount: BigInt(0),
          tdsAmount: BigInt(tdsAmount),
          finalAmount: BigInt(netCommission),
          status: 'COMPLETED',
          appliedSlabMin: commissionRule.appliedSlab?.minAmount
            ? BigInt(rupeesToPaise(commissionRule.appliedSlab.minAmount))
            : null,
          appliedSlabMax: commissionRule.appliedSlab?.maxAmount
            ? BigInt(rupeesToPaise(commissionRule.appliedSlab.maxAmount))
            : null,
          metadata: {
            ruleId: commissionRule.id,
            parentUserId: parentUser.id,
            providerMargin: totalProviderMargin,
            grossCommission,
            tdsAmount,
            netCommission,
            tdsPaidTo: parentUser.id,
            depth: depth + 1,
            note: 'Commission from provider margin. TDS 2% deducted and stored in parent TDS wallet.',
          },
          createdAt: now,
          updatedAt: now,
        });

        results.processed.push({
          userId: currentUser.id,
          roleId: currentUser.roleId,
          parentUserId: parentUser.id,
          depth: depth + 1,
          providerMargin: paiseToRupees(totalProviderMargin),
          grossCommission: paiseToRupees(grossCommission),
          tdsAmount: paiseToRupees(tdsAmount),
          netCommission: paiseToRupees(netCommission),
          tdsPaidTo: parentUser.id,
          earningId,
        });

        results.totalCommissionDistributed += netCommission;
        results.totalTDSCollected += tdsAmount;
        results.depthReached = depth + 1;

        currentUser = parentUser;
        depth++;
      } catch (error) {
        console.error(
          `Commission processing error at depth ${depth + 1} for user ${currentUser.id}:`,
          error,
        );
        results.skipped.push({
          userId: currentUser.id,
          reason: error.message,
          depth: depth + 1,
        });
        break;
      }
    }

    return results;
  }
}

export default MultiLevelCommissionEngine;
