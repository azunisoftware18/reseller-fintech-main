import { db } from '../../database/aadhaar/aadhaar-db.js';
import { aadhaarTransactionTable } from '../../models/aadhaar/aadhaarTransaction.schema.js';
import WalletService from '../wallet.service.js';

class AadhaarCallbackService {
  static async handleSuccess(txn) {
    await db.transaction(async (tx) => {
      if (txn.status !== 'PENDING') return;

      await tx
        .update(aadhaarTransactionTable)
        .set({ status: 'SUCCESS' })
        .where(eq(aadhaarTransactionTable.id, txn.id));

      // 🔹 Debit blocked surcharge
      await WalletService.debitBlockedAmount({
        walletId: txn.walletId,
        amount: txn.blockedAmount,
        transactionId: txn.id,
        reference: `AADHAAR_SUCCESS:${txn.id}`,
      });

      // 🔹 Multi-level surcharge distribution
      await MultiLevelSurcharge.process({
        transaction: txn,
        user: { id: txn.userId, roleId: txn.roleId },
      });
    });
  }

  static async handleFailure(txn) {
    await WalletService.releaseBlockedAmount({
      walletId: txn.walletId,
      amount: txn.blockedAmount,
      transactionId: txn.id,
      reference: `AADHAAR_FAIL:${txn.id}`,
    });
  }
}
