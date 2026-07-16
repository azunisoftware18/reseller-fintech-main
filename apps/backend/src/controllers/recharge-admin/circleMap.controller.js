import CircleMapService from '../../services/recharge-admin/circleMap.service.js';

// AZZUNIQUE ONLY Create / Update circle mapping
export const upsertCircleMap = async (req, res) => {
  const result = await CircleMapService.upsert(req.body, req.user);
  res.status(201).json(result);
};

// AZZUNIQUE ONLY List all circle mappings (with filters)
export const listCircleMaps = async (req, res) => {
  // 👉 Pass query filters to service
  const filters = {
    direction: req.query.direction,
    serviceId: req.query.serviceId,
    providerId: req.query.providerId,
  };

  const data = await CircleMapService.list(filters);
  res.json(data);
};
