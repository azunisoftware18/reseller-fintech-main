import { TenantSocialMediaService } from '../services/tenantSocialMedia.service.js';

export const upsertTenantSocialMedia = async (req, res) => {
  const data = await TenantSocialMediaService.upsert(req.body, req.user);
  res.json(data);
};

export const getTenantSocialMedia = async (req, res) => {
  const tenantId = req.context.tenant.id;

  const data = await TenantSocialMediaService.getById(tenantId);
  res.json(data);
};
