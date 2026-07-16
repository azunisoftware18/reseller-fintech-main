import { TenantWebsiteService } from '../services/tenantWebsite.service.js';

const upsertTenantWebsite = async (req, res) => {
  const result = await TenantWebsiteService.upsert(req.body, req.user, {
    logo: req.files?.logo?.[0],
    favicon: req.files?.favicon?.[0],
  });

  res.json(result);
};

const getTenantWebsite = async (req, res) => {
  const tenantId = req.context.tenant.id;
  const website = await TenantWebsiteService.getByTenantId(tenantId);
  res.json(website);
};

export { upsertTenantWebsite, getTenantWebsite };
