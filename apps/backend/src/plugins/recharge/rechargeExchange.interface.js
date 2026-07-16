/**
 * “Jo bhi recharge provider banna chahta hai, ye functions implement karne honge.”
 *  Recharge Plugin Interface
 *
 * NOTE:
 * - Transaction mandatory
 */
export default class RechargeExchangePluginInterface {
  constructor(config) {
    this.config = config;
  }

  // Mandatory (RECHARGE_EXCHANGE)
  async recharge(_params) {
    throw new Error('recharge not implemented');
  }

  async checkStatus(_params) {
    throw new Error('checkStatus not implemented');
  }

  async fetchBalance() {
    throw new Error('fetchBalance not implemented');
  }

  async complain(_params) {
    throw new Error('complain not implemented');
  }
}
