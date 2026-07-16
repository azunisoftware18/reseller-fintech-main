import { db } from '../database/core/core-db.js';
import { walletTable, tenantsTable } from '../models/core/index.js';
import { eq } from 'drizzle-orm';
import WalletService from '../services/wallet.service.js';

export async function runMonthlySettlement() {
  const tenants = await db.select().from(tenantsTable);

  for (const tenant of tenants) {
    try {
      await runSettlement({ tenantId: tenant.id });
    } catch (e) {
      console.error('[CRON] Settlement failed', tenant.id, e.message);
    }
  }
}

export async function runSettlement({ tenantId }) {
  const commissionWallets = await db
    .select()
    .from(walletTable)
    .where(
      and(
        eq(walletTable.walletType, 'COMMISSION'),
        eq(walletTable.tenantId, tenantId),
      ),
    );

  const [settlementWallet] = await db
    .select()
    .from(walletTable)
    .where(
      and(
        eq(walletTable.walletType, 'SETTLEMENT'),
        eq(walletTable.tenantId, tenantId),
      ),
    )
    .limit(1);

  if (!settlementWallet) return;

  for (const wallet of commissionWallets) {
    if (wallet.balance <= 0) continue;

    const amount = wallet.balance;

    await db.transaction(async (tx) => {
      const [lockedWallet] = await tx
        .select()
        .from(walletTable)
        .where(eq(walletTable.id, wallet.id))
        .forUpdate()
        .limit(1);

      if (!lockedWallet || lockedWallet.balance <= 0) return;

      const amount = lockedWallet.balance;

      // Debit commission wallet and credit settlement wallet
      await WalletService.debitWallet({
        walletId: lockedWallet.id,
        amount,
        reference: `SETTLEMENT:${settlementWallet.id}:${lockedWallet.id}`,
      });

      // Credit settlement wallet
      await WalletService.creditWallet({
        walletId: settlementWallet.id,
        amount,
        reference: `SETTLEMENT:${lockedWallet.id}:${settlementWallet.id}`,
      });
    });
  }
}
