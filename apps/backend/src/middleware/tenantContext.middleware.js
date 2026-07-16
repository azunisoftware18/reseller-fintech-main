import { db } from '../database/core/core-db.js';
import { ApiError } from '../lib/ApiError.js';
import { tenantsDomainsTable } from '../models/core/tenantDomain.schema.js';
import { tenantsTable } from '../models/core/tenant.schema.js';
import { eq } from 'drizzle-orm';

export async function tenantContextMiddleware(req, _, next) {
  try {
    const host = extractTenantHost(req);

    // Skip tenant check for health & internal routes
    // if (!host || host === 'localhost') {
    //   return next();
    // }

    const [domain] = await db
      .select()
      .from(tenantsDomainsTable)
      .where(eq(tenantsDomainsTable.domainName, host))
      .limit(1);

    if (!domain) {
      return next(ApiError.notFound('Tenant domain not found'));
    }

    const [tenant] = await db
      .select()
      .from(tenantsTable)
      .where(eq(tenantsTable.id, domain.tenantId))
      .limit(1);

    if (!tenant || tenant.tenantStatus !== 'ACTIVE') {
      return next(ApiError.forbidden('Tenant inactive'));
    }

    req.context = { tenant, domain };
    next();
  } catch (err) {
    next(err);
  }
}

function extractTenantHost(req) {
  let host = req.headers['x-forwarded-host'] || req.headers.host;

  if (!host) return null;

  host = host.split(',')[0]; // proxy safe
  host = host.split(':')[0]; // remove port
  host = host.toLowerCase();

  // strip api.
  if (host.startsWith('api.')) {
    host = host.slice(4);
  }

  return host;
}
