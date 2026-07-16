import { ApiError } from '../../lib/ApiError.js';
import ManualFundPlugin from '../../plugins/fund-request/manualFund.plugin.js';

// Central plugin resolver
export function getFundRequestPlugin(providerCode, config) {
  switch (providerCode) {
    case 'MANUAL':
      return new ManualFundPlugin(config);

    default:
      throw ApiError.internal('Unknown fund request provider');
  }
}
