import PayoutService from '../../services/payout/payout.service.js';

export const performPayout = async (req, res) => {
  try {
    // Validate amount based on mode before processing
    const { amount, mode } = req.body;

    if (mode === 'RTGS' && amount < 200000) {
      return res.status(400).json({
        success: false,
        message: 'RTGS minimum amount is ₹200,000',
      });
    }

    if ((mode === 'NEFT' || mode === 'IMPS') && amount < 1) {
      return res.status(400).json({
        success: false,
        message: `${mode} minimum amount is ₹1`,
      });
    }

    if (mode === 'FT' && amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'FT amount must be greater than 0',
      });
    }

    const result = await PayoutService.performPayout(req.body, req.user);
    res.status(201).json(result);
  } catch (error) {
    if (error.message?.includes('RBL Error')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    throw error;
  }
};

export const getHistory = async (req, res) => {
  const result = await PayoutService.getHistory(req.query, req.user);
  res.status(200).json(result);
};

export const getDetails = async (req, res) => {
  const result = await PayoutService.getDetails(
    req.params.transactionId,
    req.user,
  );
  res.status(200).json(result);
};

export const checkStatus = async (req, res) => {
  const result = await PayoutService.checkStatus(req.params, req.user);
  res.status(200).json(result);
};
