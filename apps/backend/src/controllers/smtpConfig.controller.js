import { SmtpConfigService } from '../services/smtpConfig.service.js';

export const createSmtpConfig = async (req, res) => {
  const config = await SmtpConfigService.create(req.body, req.user);
  res.status(201).json(config);
};

export const updateSmtpConfig = async (req, res) => {
  const config = await SmtpConfigService.update(
    req.params.id,
    req.body,
    req.user,
  );
  res.json(config);
};

export const getSmtpConfigById = async (req, res) => {
  const config = await SmtpConfigService.getByTenant(req.user);
  res.json(config);
};
