import { ApiError } from '../../lib/ApiError.js';
import BulkpePancardPlugin from '../../plugins/pancard/bulkpe.plugin.js';
// import InstantpayPanPlugin from '../../plugins/pan/instantpay.pan.plugin.js';

export function getPanPlugin(providerCode, config) {
  switch (providerCode) {
    case 'BULKPE':
      return new BulkpePancardPlugin(config);

    // case 'INSTANTPAY':
    //   return new InstantpayPanPlugin(config);

    default:
      throw ApiError.internal('Unknown PAN KYC provider');
  }
}
