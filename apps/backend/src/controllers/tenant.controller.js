import { TenantService } from '../services/tenant.service.js';

export const createTenant = async (req, res) => {
  const tenant = await TenantService.create(req.body, req.user);
  res.status(201).json({
    data: tenant,
    message: 'Tenant created successfully',
  });
};

export const findAllTenants = async (req, res) => {
  const result = await TenantService.findAll(req.user, req.query);

  res.json({
    data: result.data,
    meta: result.meta,
    message: 'Fetched successfully',
  });
};

export const findTenant = async (req, res) => {
  const tenant = await TenantService.findOne(req.params.id, req.user);

  res.json({
    data: tenant,
    message: 'Tenant fetched successfully',
  });
};

export const updateTenant = async (req, res) => {
  const tenant = await TenantService.update(req.params.id, req.body, req.user);

  res.json({
    data: tenant,
    message: 'Tenant updated successfully',
  });
};

export const getAllDescendants = async (req, res) => {
  const data = await TenantService.getAllDescendants(
    req.params,
    req.user,
    req.query,
  );

  res.json({
    data,
    message: 'Descendants fetched successfully',
  });
};
