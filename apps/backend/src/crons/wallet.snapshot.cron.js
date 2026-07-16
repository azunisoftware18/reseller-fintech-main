import { db } from '../database/core/core-db.js';
import { walletSnapshotTable, walletTable } from '../models/core/index.js';
import crypto from 'crypto';

export async function takeDailyWalletSnapshot() {
  const wallets = await db.select().from(walletTable);

  const snapshotDate = new Date();
  snapshotDate.setHours(0, 0, 0, 0);

  for (const w of wallets) {
    await db.insert(walletSnapshotTable).values({
      id: crypto.randomUUID(),
      walletId: w.id,
      balance: w.balance,
      blockedAmount: w.blockedAmount,
      snapshotDate,
    });
  }

  console.log('[CRON] Wallet snapshot completed');
}
