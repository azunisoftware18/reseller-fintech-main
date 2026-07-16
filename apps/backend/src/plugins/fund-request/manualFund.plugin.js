import ManualFundPluginInterface from './manualFund.interface.js';

class ManualFundPlugin extends ManualFundPluginInterface {
  async createTransaction({ amount, paymentMode }) {
    return {
      status: 'PENDING',
      amount,
      paymentMode,
    };
  }

  async changeStatus({ transid, status }) {
    return {
      providerTxnId: transid,
      status,
    };
  }

  async refund({ transid, amount }) {
    return {
      providerTxnId: transid,
      refundedAmount: amount,
      status: 'REFUNDED',
    };
  }
}

export default ManualFundPlugin;
