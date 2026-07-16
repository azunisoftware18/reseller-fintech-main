import OperatorMapService from '../../services/recharge-admin/operatorMap.service.js';

// AZZUNIQUE ONLY Create / Update operator mapping
export const upsertOperatorMap = async (req, res) => {
  const result = await OperatorMapService.upsert(req.body, req.user);
  res.status(201).json(result);
};

// AZZUNIQUE ONLY List all operator mappings (with filters)
export const listOperatorMaps = async (req, res) => {
  // 👉 Pass query filters to service
  const filters = {
    direction: req.query.direction,
    serviceId: req.query.serviceId,
    providerId: req.query.providerId,
  };

  const data = await OperatorMapService.list(filters);
  res.json(data);
};
