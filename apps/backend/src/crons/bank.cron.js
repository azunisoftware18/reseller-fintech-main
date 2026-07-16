// bank.sync.cron.js
import cron from 'node-cron';
import bankDetailService from '../services/bankDetail.service.js';

export function startBankSyncCron() {
  // every 1 hour
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('⏰ Bank sync cron running...');
      await bankDetailService.syncBanks();
    } catch (err) {
      console.error('❌ Bank cron failed:', err.message);
    }
  });
}
