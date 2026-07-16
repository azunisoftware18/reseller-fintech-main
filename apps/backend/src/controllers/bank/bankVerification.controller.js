import bankVerificationService from '../../services/bank/bankVerification.service.js';

export const pennyDropVerification = async (req, res, next) => {
  try {
    const result = await bankVerificationService.pennyDropVerification(
      req.body,
      req.user,
    );
    res.status(201).json(result);
  } catch (error) {
    if (error.message?.includes('Verification Error')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};
