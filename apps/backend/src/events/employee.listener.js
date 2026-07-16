import { eventBus } from './events.js';
import { EVENTS } from './events.constants.js';
import { MailTemplates } from '../email/templates/index.js';
import { db } from '../database/core/core-db.js';
import { tenantsTable } from '../models/core/tenant.schema.js';
import { ApiError } from '../lib/ApiError.js';
import { smtpConfigTable } from '../models/core/smtpConfig.schema.js';
import { tenantsDomainsTable } from '../models/core/tenantDomain.schema.js';
import { eq } from 'drizzle-orm';

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

  const [domain] = await db
    .select()
    .from(tenantsDomainsTable)
    .where(eq(tenantsDomainsTable.tenantId, tenantId))
    .limit(1);

  if (!domain) {
    throw ApiError.badRequest('Tenant domain not whitelisted');
  }

  return {
    tenant,
    smtp,
    domain,
  };
}

eventBus.on(EVENTS.EMPLOYEE_CREATED, async (data) => {
  try {
    console.log('👤 EMPLOYEE_CREATED event');

    const { tenant, smtp, domain } = await getTenantMailContext(data.tenantId);

    const mail = MailTemplates.employeeCreated({
      tenantName: tenant.tenantName,
      smtpFromEmail: smtp.fromEmail,
      tenantWhatsapp: tenant.tenantWhatsapp,
      userType: tenant.userType,
      loginUrl: domain.domainName,

      employeeNumber: data.employeeNumber,
      email: data.email,
      password: data.password,
    });

    eventBus.emit(EVENTS.MAIL_SEND, {
      tenantId: data.tenantId,
      to: data.email,
      subject: mail.subject,
      html: mail.html,
    });
  } catch (err) {
    console.error('❌ EMPLOYEE_CREATED mail error:', err.message);
  }
});

// ======== status chnage ==========
eventBus.on(EVENTS.EMPLOYEE_STATUS_CHANGED, async (data) => {
  try {
    console.log('🔁 EMPLOYEE_STATUS_CHANGED', data.newStatus);

    // ✅ Add validation
    if (!data.email) {
      console.error('❌ No email provided for status change notification');
      return;
    }

    const { tenant, smtp, domain } = await getTenantMailContext(data.tenantId);

    // Fetch employee email if not provided
    let employeeEmail = data.email;
    if (!employeeEmail && data.employeeId) {
      const [employee] = await db
        .select({ email: employeesTable.email })
        .from(employeesTable)
        .where(eq(employeesTable.id, data.employeeId))
        .limit(1);
      employeeEmail = employee?.email;
    }

    let mail;

    switch (data.newStatus) {
      case 'ACTIVE':
        mail = MailTemplates.employeeActivated({
          tenantName: tenant.tenantName,
          smtpFromEmail: smtp.fromEmail,
          tenantWhatsapp: tenant.tenantWhatsapp,
          userType: tenant.userType,
          loginUrl: domain.domainName,
          actionReason: data.actionReason,
        });
        break;

      case 'INACTIVE':
        mail = MailTemplates.employeeInactive({
          tenantName: tenant.tenantName,
          smtpFromEmail: smtp.fromEmail,
          tenantWhatsapp: tenant.tenantWhatsapp,
          userType: tenant.userType,
          loginUrl: domain.domainName,
          actionReason: data.actionReason,
        });
        break;

      case 'SUSPENDED':
        mail = MailTemplates.employeeSuspended({
          tenantName: tenant.tenantName,
          smtpFromEmail: smtp.fromEmail,
          tenantWhatsapp: tenant.tenantWhatsapp,
          userType: tenant.userType,
          loginUrl: domain.domainName,
          actionReason: data.actionReason,
        });
        break;

      default:
        return;
    }

    if (mail && employeeEmail) {
      eventBus.emit(EVENTS.MAIL_SEND, {
        tenantId: data.tenantId,
        to: employeeEmail,
        subject: mail.subject,
        html: mail.html,
      });
    }
  } catch (err) {
    console.error('❌ STATUS_CHANGE mail error:', err.message);
  }
});
