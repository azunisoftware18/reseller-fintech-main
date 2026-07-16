import { ApiError } from '../../lib/ApiError.js';
import RblPayoutPlugin from '../../plugins/payout/rblPayout.plugin.js';

export function getPayoutPlugin(providerCode, config) {
  switch (providerCode) {
    case 'RBL':
      return new RblPayoutPlugin(config);

    default:
      throw ApiError.internal('Unknown payout provider');
  }
}
