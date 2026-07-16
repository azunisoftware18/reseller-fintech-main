import { ServerDetailService } from '../services/serverDetail.service.js';

export const upsertServerDetail = async (req, res) => {
  const record = await ServerDetailService.upsert(req.body, req.user);
  res.json(record);
};

export const getServerDetailById = async (req, res) => {
  const server = await ServerDetailService.getByTenantId(req.user);
  res.json(server);
};
export const getAll = async (req, res) => {
  const server = await ServerDetailService.getAll(req.user);
  res.json(server);
};
