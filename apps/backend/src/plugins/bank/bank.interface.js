export default class BankPluginInterface {
  constructor(config) {
    this.config = config;
  }

  // Fetch bank list
  async fetchBanks(_params) {
    throw new Error('fetchBanks not implemented');
  }

  async verify(_params) {
    throw new Error('bank verify Method not implemented');
  }
}
