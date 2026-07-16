import { PermissionMiddleware } from './permission.middleware.js';
import { PermissionsRegistry } from '../lib/PermissionsRegistry.js';
import { ApiError } from '../lib/ApiError.js';

export const KycPermissionResolver = (action) => {
  return (req, res, next) => {
    const { type } = req.params;

    let permission;

    switch (type.toLowerCase()) {
      case 'aadhaar':
        permission =
          action === 'SEND'
            ? [
                PermissionsRegistry.AADHAAR.API_CREATE,
                PermissionsRegistry.AADHAAR.MANUAL_CREATE,
              ]
            : PermissionsRegistry.AADHAAR.VERIFY;
        break;

    //   case 'pan':
    //     permission =
    //       action === 'SEND'
    //         ? PermissionsRegistry.SERVICES.PAN.CREATE
    //         : PermissionsRegistry.SERVICES.PAN.VERIFY;
    //     break;

      default:
        throw ApiError.badRequest('Invalid KYC type');
    }

    return PermissionMiddleware(permission)(req, res, next);
  };
};
