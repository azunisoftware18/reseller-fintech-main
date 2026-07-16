import { db } from '../database/core/core-db.js';
import { commissionEarningTable } from '../models/core/index.js';
import { eq } from 'drizzle-orm';
import WalletService from './wallet.service.js';

class CommissionReversalService {
  static async reverseByTransaction(transactionId) {
    const earnings = await db
      .select()
      .from(commissionEarningTable)
      .where(eq(commissionEarningTable.transactionId, transactionId));

    if (!earnings.length) return;

    for (const e of earnings) {
      // Reverse commission wallet credit
      await WalletService.debitWallet({
        walletId: e.walletId,
        amount: e.netAmount,
        transactionId,
        reference: `COMMISSION_REVERSAL:${transactionId}:${e.userId}`,
      });

      //  Remove commission record
      await db
        .delete(commissionEarningTable)
        .where(eq(commissionEarningTable.id, e.id));
    }
  }
}

export default CommissionReversalService;
