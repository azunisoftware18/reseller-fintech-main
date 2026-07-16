import nodemailer from 'nodemailer';
import { db } from '../database/core/core-db.js';
import { smtpConfigTable } from '../models/core/smtpConfig.schema.js';
import { eq } from 'drizzle-orm';
import { decrypt } from '../lib/lib.js';
import { ApiError } from '../lib/ApiError.js';

export async function sendMail(payload) {
  if (!payload.tenantId) {
    throw ApiError.badRequest('tenantId is required for sending mail');
  }

  const [smtp] = await db
    .select()
    .from(smtpConfigTable)
    .where(eq(smtpConfigTable.tenantId, payload.tenantId))
    .limit(1);

  if (!smtp) {
    throw ApiError.badRequest('SMTP config not found for tenant');
  }

  const smtpPassword = decrypt(smtp.smtpPassword);

  const transporter = nodemailer.createTransport({
    host: smtp.smtpHost,
    port: Number(smtp.smtpPort),
    secure: smtp.encryptionType === 'SSL', // SSL = true
    auth: {
      user: smtp.smtpUsername,
      pass: smtpPassword,
    },
  });

  await transporter.sendMail({
    from: `"${smtp.fromName}" <${smtp.smtpUsername}>`,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
  });
}
