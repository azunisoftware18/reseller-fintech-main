import { ApiError } from '../../lib/ApiError.js';

import InstantpayBankPlugin from '../../plugins/bank/instantpay.plugin.js';
import PaysprintVerificationPlugin from '../../plugins/bank/paysprint.plugin.js';

export function getBanksPlugin(providerCode, config) {
  switch (providerCode) {
    case 'INSTANTPAY':
      return new InstantpayBankPlugin(config);
    case 'PAYSPRINT':
      return new PaysprintVerificationPlugin(config);

    default:
      throw ApiError.internal('Unknown bank provider');
  }
}
