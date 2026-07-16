import FundTransactionService from '../../services/fund-request/fundTransaction.service.js';

export const createFundTransaction = async (req, res) => {
  const result = await FundTransactionService.initiateFundRequest({
    payload: req.body,
    actor: req.user,
  });

  res.status(201).json(result);
};

export const changeFundStatus = async (req, res) => {
  const result = await FundTransactionService.changeStatus(
    req.params.id,
    req.body,
    req.user,
  );

  res.json(result);
};

export const refundFundTransaction = async (req, res) => {
  const result = await FundTransactionService.refund({
    transactionId: req.params.id,
    actor: req.user,
  });

  res.json(result);
};

export const listTransactions = async (req, res) => {
  const result = await FundTransactionService.findAll(req.query, req.user);
  res.json(result);
};
