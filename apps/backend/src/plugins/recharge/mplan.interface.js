/**
 * “Jo bhi recharge provider banna chahta hai, ye functions implement karne honge.”
 *  Recharge Plugin Interface
 *
 * NOTE:
 * - Plan / Offer mandatory
 */
export default class MplanPluginInterface {
  constructor(config) {
    this.config = config;
  }

  // Mandatory (MPLAN)
  async fetchPlans(_params) {
    throw new Error('fetchPlans not implemented');
  }

  async fetchOffers(_params) {
    throw new Error('fetchOffers not implemented');
  }
}
