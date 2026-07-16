import { ApiError } from '../../lib/ApiError.js';
import BulkpeAadhaarPlugin from '../../plugins/aadhaar/bulkpe.plugin.js';
import ManualAadhaarPlugin from '../../plugins/aadhaar/manual.plugin.js';

// Central KYC plugin resolver
export function getAadhaarPlugin(providerCode, config) {
  switch (providerCode) {
    case 'BULKPE':
      return new BulkpeAadhaarPlugin(config);

    case 'MANUAL_AADHAAR':
      return new ManualAadhaarPlugin({});

    default:
      throw ApiError.internal('Unknown Aadhaar KYC provider');
  }
}
