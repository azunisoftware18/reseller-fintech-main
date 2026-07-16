import BankDetailService from '../services/bankDetail.service.js';

export const submitBankDetail = async (req, res) => {
  try {
    const { body, user: actor } = req;
    // Default to self; only use body.userId for parent/downline flows
    const targetUserId = body.userId || actor.id;

    const result = await BankDetailService.submitBankDetail(
      {
        userId: targetUserId,
        bankDetail: body.bankDetail,
      },
      actor,
    );

    res
      .status(201)
      .json({ success: true, data: result, message: result.message });
  } catch (error) {
    console.error('[Bank Detail Submit] Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};

export const resubmitBankDetail = async (req, res) => {
  try {
    const { body, user: actor } = req;
    // Default to self; only use body.userId for parent/downline flows
    const targetUserId = body.userId || actor.id;

    const result = await BankDetailService.resubmitBankDetail(
      {
        userId: targetUserId,
        bankDetailId: body.bankDetailId,
        bankDetail: body.bankDetail,
      },
      actor,
    );

    res
      .status(200)
      .json({ success: true, data: result, message: result.message });
  } catch (error) {
    console.error('[Bank Detail Resubmit] Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};

export const approveBankDetail = async (req, res) => {
  try {
    const result = await BankDetailService.approveBankDetail(
      req.body,
      req.user,
    );
    res
      .status(200)
      .json({ success: true, data: result, message: result.message });
  } catch (error) {
    console.error('[Bank Detail Approve] Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};

export const rejectBankDetail = async (req, res) => {
  try {
    const result = await BankDetailService.rejectBankDetail(req.body, req.user);
    res
      .status(200)
      .json({ success: true, data: result, message: result.message });
  } catch (error) {
    console.error('[Bank Detail Reject] Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};

export const getUserBankDetails = async (req, res) => {
  try {
    const result = await BankDetailService.getUserBankDetails(
      req.params.userId,
      req.user,
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('[Get User Bank Details] Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};

export const getBankDetailById = async (req, res) => {
  try {
    const result = await BankDetailService.getBankDetailById(
      req.params.bankDetailId,
      req.user,
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('[Get Bank Detail By Id] Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};

export const setPrimaryBank = async (req, res) => {
  try {
    const result = await BankDetailService.setPrimaryBank(
      req.params.bankDetailId,
      req.user,
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('[Set Primary Bank] Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};

export const deleteBankDetail = async (req, res) => {
  try {
    const result = await BankDetailService.deleteBankDetail(
      req.params.bankDetailId,
      req.user,
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('[Delete Bank Detail] Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};

export const getBankDetailStatus = async (req, res) => {
  try {
    const result = await BankDetailService.getBankDetailStatus(
      req.params.userId,
      req.user,
    );
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('[Bank Detail Status] Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};

export const getBankDetailsForApprover = async (req, res) => {
  try {
    const result = await BankDetailService.getBankDetailsForApprover(
      req.user,
      req.query,
    );
    res
      .status(200)
      .json({ success: true, data: result.data, meta: result.meta });
  } catch (error) {
    console.error('[Bank Detail List] Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};

export const getAllBanks = async (req, res) => {
  try {
    const result = await BankDetailService.getAllBanks(req.query);
    res.status(200).json(result);
  } catch (error) {
    console.error('[Get All Banks] Error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Internal Server Error',
    });
  }
};
