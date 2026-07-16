import { serializeBigInt } from '../lib/lib.js';
import TransactionService from '../services/transaction.service.js';

export const getTransactions = async (req, res) => {
  const result = await TransactionService.getTransactions(req.user, req.query);

  res.status(200).json({
    success: true,
    data: {
      transactions: serializeBigInt(result.transactions),
    },
    meta: result.meta,
  });
};

export const getTransactionEarnings = async (req, res) => {
  const result = await TransactionService.getTransactionEarnings(
    req.user,
    req.query,
  );

  res.status(200).json({
    success: true,
    data: {
      earnings: result.earnings,
    },
    meta: result.meta,
  });
};
