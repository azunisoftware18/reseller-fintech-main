import { eventBus } from './events.js';
import { EVENTS } from './events.constants.js';
import { db } from '../database/core/core-db.js';
import { randomUUID } from 'crypto';
import { mailQueueTable } from '../models/core/index.js';

eventBus.on(EVENTS.MAIL_SEND, async (payload) => {
  if (!payload.to) {
    console.error('❌ MAIL_SEND: No recipient email provided', payload);
    return;
  }

  await db.insert(mailQueueTable).values({
    id: randomUUID(),
    tenantId: payload.tenantId,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    status: 'PENDING',
    attempts: 0,
    nextAttemptAt: new Date(),
  });
});
