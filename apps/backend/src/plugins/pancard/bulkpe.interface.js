/**
 * PAN KYC Plugin Interface
 *
 * NOTE:
 * - PAN verification is direct (no OTP)
 */

export default class PancardPluginInterface {
  constructor(config) {
    this.config = config;
  }

  // Verify PAN and fetch details
  async verifyPan(_params) {
    throw new Error('verifyPan not implemented');
  }
}
