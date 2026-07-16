import { TenantDomainService } from '../services/tenantDomain.service.js';

export const createTenantDomain = async (req, res) => {
  const domain = await TenantDomainService.upsert(req.body, req.user);
  res.status(201).json(domain);
};

export const getByTenantId = async (req, res) => {
  const domain = await TenantDomainService.findByTenantId(req.params.tenantId);
  res.json(domain);
};
