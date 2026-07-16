export default class RblPayoutPluginInterface {
  constructor(config) {
    this.config = config;
  }

  /** Initiate a payout (NEFT / RTGS / IMPS / FT / DD) */
  async payout(_params) {
    throw new Error('payout not implemented');
  }

  /** Check status using RBL Status API */
  async checkStatus(_params) {
    throw new Error('checkStatus not implemented');
  }
}
