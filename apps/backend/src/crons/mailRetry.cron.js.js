import { db } from '../database/core/core-db.js';
import { mailQueueTable } from '../models/core/index.js';
import { and, eq, lt } from 'drizzle-orm';
import { sendMail } from '../email/mail.service.js';

export async function autoRetryPendingMails() {
  const mails = await db
    .select()
    .from(mailQueueTable)
    .where(
      and(
        eq(mailQueueTable.status, 'PENDING'),
        lt(mailQueueTable.nextAttemptAt, new Date()),
      ),
    )
    .limit(50);

  for (const mail of mails) {
    try {
      // 🔒 Lock row
      await db
        .update(mailQueueTable)
        .set({ status: 'PROCESSING' })
        .where(eq(mailQueueTable.id, mail.id));

      await sendMail(mail);

      await db
        .update(mailQueueTable)
        .set({
          status: 'SENT',
          updatedAt: new Date(),
        })
        .where(eq(mailQueueTable.id, mail.id));

      console.log('✅ Mail sent:', mail.to);
    } catch (err) {
      const attempts = mail.attempts + 1;
      const delay = Math.min(2 ** attempts * 1000, 600000);

      await db
        .update(mailQueueTable)
        .set({
          attempts,
          status: attempts >= 5 ? 'FAILED' : 'PENDING',
          nextAttemptAt: new Date(Date.now() + delay),
          errorMessage: err.message,
          updatedAt: new Date(),
        })
        .where(eq(mailQueueTable.id, mail.id));

      console.error('❌ Mail retry failed:', mail.to, err.message);
    }
  }
  console.log('✅ Mail Retry status cron started');
}
