import AuditService from '../services/audit.service.js';

export const listAll = async (req, res) => {
  const result = await AuditService.listAll(req.user, req.query);

  res.status(200).json({
    success: true,
    data: {
      logs: result.logs,
    },
    meta: result.meta,
  });
};
