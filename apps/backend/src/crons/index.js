import cron from 'node-cron';

import { reconcileWallets } from './ledger.reconciliation.cron.js';
import { takeDailyWalletSnapshot } from './wallet.snapshot.cron.js';
import envConfig from '../config/config.js';
import { runMonthlySettlement } from './settlement.cron.js';
import { autoRetryPendingMails } from './mailRetry.cron.js.js';
import { startBankSyncCron } from './bank.cron.js';

export function startAllCrons() {
  if (envConfig.enableCrons !== 'true') {
    console.log('⏭ All crons disabled');
    return;
  }

  // Ledger reconciliation every night 2 AM
  cron.schedule('0 2 * * *', reconcileWallets);

  // Wallet snapshot daily at 12:05 AM
  cron.schedule('5 0 * * *', takeDailyWalletSnapshot);

  // Monthly settlement (1st day 1 AM)
  cron.schedule('0 1 1 * *', runMonthlySettlement);

  // Mail
  cron.schedule('*/30 * * * * *', autoRetryPendingMails);

  // Bank sync cron
  startBankSyncCron();

  console.log('✅ All crons started');
}
