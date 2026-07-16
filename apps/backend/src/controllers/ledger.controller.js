import { serializeBigInt } from '../lib/lib.js';
import LedgerService from '../services/ledger.service.js';

export const getMyLedger = async (req, res) => {
  const result = await LedgerService.getMyLedger(req.user, req.query);

  res.status(200).json({
    success: true,
    data: serializeBigInt(result.data),
    meta: result.meta,
  });
};
