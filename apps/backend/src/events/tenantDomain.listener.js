import { eventBus } from './events.js';
import { EVENTS } from './events.constants.js';
import { MailTemplates } from '../email/templates/index.js';
import { db } from '../database/core/core-db.js';
import { tenantsTable } from '../models/core/tenant.schema.js';
import { ApiError } from '../lib/ApiError.js';
import { smtpConfigTable } from '../models/core/smtpConfig.schema.js';
import { tenantsDomainsTable } from '../models/core/tenantDomain.schema.js';
import { eq } from 'drizzle-orm';
import { serverDetailTable } from '../models/core/serverDetails.schema.js';

export async function getTenantMailContext(tenantId) {
  const [tenant] = await db
    .select()
    .from(tenantsTable)
    .where(eq(tenantsTable.id, tenantId))
    .limit(1);

  if (!tenant) {
    throw ApiError.badRequest('Invalid tenant');
  }

  const [smtp] = await db
    .select()
    .from(smtpConfigTable)
    .where(eq(smtpConfigTable.tenantId, tenantId))
    .limit(1);

  if (!smtp) {
    throw ApiError.badRequest('SMTP not configured for tenant');
  }

  const [serverDetail] = await db
    .select()
    .from(serverDetailTable)
    .where(eq(serverDetailTable.tenantId, tenantId))
    .limit(1);

  if (!serverDetail) {
    throw ApiError.badRequest('Server detail not configured for tenant');
  }

  return {
    tenant,
    smtp,
    serverDetail,
  };
}

eventBus.on(EVENTS.DOMAIN_CREATE, async (data) => {
  try {
    console.log('👤 DOMAIN_CREATE event');

    const { tenant, smtp, serverDetail } = await getTenantMailContext(
      data.tenantId,
    );

    const mail = MailTemplates.tenantDomainCreated({
      tenantName: tenant.tenantName,
      smtpFromEmail: smtp.fromEmail,
      tenantWhatsapp: tenant.tenantWhatsapp,
      recordType: serverDetail.recordType,
      hostName: serverDetail.hostname,
      value: serverDetail.value,
    });

    eventBus.emit(EVENTS.MAIL_SEND, {
      tenantId: data.tenantId,
      to: data.email,
      subject: mail.subject,
      html: mail.html,
    });
  } catch (err) {
    console.error('❌ DOMAIN_CREATE mail error:', err.message);
  }
});
