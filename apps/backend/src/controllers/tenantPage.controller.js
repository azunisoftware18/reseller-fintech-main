import { TenantPageService } from '../services/tenantPage.service.js';

export const createTenantPage = async (req, res) => {
  const page = await TenantPageService.create(req.body, req.user);
  res.json(page);
};

export const updateTenantPage = async (req, res) => {
  const page = await TenantPageService.update(
    req.params.id,
    req.body,
    req.user,
  );
  res.json(page);
};

export const deleteTenantPage = async (req, res) => {
  await TenantPageService.delete(req.params.id, req.user);
  res.json({ success: true });
};

export const getTenantPageById = async (req, res) => {
  const page = await TenantPageService.getById(req.params.id, req.user);
  res.json(page);
};

export const getPublicTenantPages = async (req, res) => {
  const tenantId = req.context.tenant.id; // from tenantContextMiddleware
  const pages = await TenantPageService.getAll(tenantId);
  res.json(pages);
};
