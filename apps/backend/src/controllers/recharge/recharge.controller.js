import RechargeService from '../../services/recharge/recharge.service.js';

export const fetchPlans = async (req, res) => {
  const result = await RechargeService.fetchPlans(req.body, req.user);
  res.status(200).json(result);
};

export const performRecharge = async (req, res) => {
  const result = await RechargeService.performRecharge(req.body, req.user);
  res.status(201).json(result);
};

export const getHistory = async (req, res) => {
  const result = await RechargeService.getHistory(req.query, req.user);
  res.status(200).json(result);
};

export const getDetails = async (req, res) => {
  const result = await RechargeService.getDetails(
    req.params.transactionId,
    req.user,
  );
  res.status(200).json(result);
};

export const checkStatus = async (req, res) => {
  const result = await RechargeService.checkStatus(req.params, req.user);
  res.status(200).json(result);
};

export const handleCallback = async (req, res) => {
  const result = await RechargeService.handleCallback(req.query);
  res.status(200).json(result);
};
