import { db } from '../database/core/core-db.js';
import { walletTable, ledgerTable } from '../models/core/index.js';
import { eq, desc } from 'drizzle-orm';

export async function reconcileWallets() {
  const wallets = await db.select().from(walletTable);
  const mismatches = [];

  for (const wallet of wallets) {
    const [lastLedger] = await db
      .select()
      .from(ledgerTable)
      .where(eq(ledgerTable.walletId, wallet.id))
      .orderBy(desc(ledgerTable.createdAt))
      .limit(1);

    if (!lastLedger) continue;

    if (wallet.balance !== lastLedger.balanceAfter) {
      mismatches.push({
        walletId: wallet.id,
        walletBalance: wallet.balance,
        ledgerBalance: lastLedger.balanceAfter,
      });
    }
  }

  if (mismatches.length) {
    console.warn('[CRON] Ledger mismatch detected', mismatches);
  }
}
