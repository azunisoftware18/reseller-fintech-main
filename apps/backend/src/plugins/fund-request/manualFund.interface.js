/**
 * Manual Fund Plugin Interface
 *
 * NOTE:
 * - Transaction mandatory
 */

export default class ManualFundPluginInterface {
  constructor(config) {
    this.config = config;
  }

  // Create fund request
  async createTransaction(_params) {
    throw new Error('createTransaction not implemented');
  }

  // Admin change status
  async changeStatus(_params) {
    throw new Error('changeStatus not implemented');
  }

  // Refund (manual reverse)
  async refund(_params) {
    throw new Error('refund not implemented');
  }

  async fetchBalance(_params) {
    throw new Error('fetchBalance not implemented');
  }
}
