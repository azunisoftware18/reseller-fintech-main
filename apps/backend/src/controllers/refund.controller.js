import RefundService from '../services/refund.service.js';

export const getAllRefunds = async (req, res) => {
  const result = await RefundService.getAllRefunds({
    actor: req.user,
    query: req.query,
  });

  res.status(200).json({
    success: true,
    data: {
      refunds: result.refunds,
    },
    meta: result.meta,
  });
};
