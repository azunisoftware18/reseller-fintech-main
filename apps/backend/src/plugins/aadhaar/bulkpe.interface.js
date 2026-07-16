/**
 * Aadhaar KYC Plugin Interface
 *
 * Har Aadhaar KYC provider ko ye 2 methods implement karne honge:
 *
 * 1️⃣ sendOtp()
 * 2️⃣ verifyOtp()
 *
 * Return Contract:
 * - sendOtp() → { referenceId, raw }
 * - verifyOtp() → { verificationStatus, aadhaarData, raw }
 *
 * NOTE:
 * - Always return provider raw response (audit purpose)
 * - Never return full Aadhaar number
 */

export default class AadhaarPluginInterface {
  constructor(config) {
    if (!config) {
      throw new Error('Plugin config is required');
    }

    this.config = config;
  }

  async sendOtp(_params) {
    throw new Error(`${this.constructor.name} must implement sendOtp()`);
  }

  async verifyOtp(_params) {
    throw new Error(`${this.constructor.name} must implement verifyOtp()`);
  }
}
