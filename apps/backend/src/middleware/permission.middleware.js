import { resolvePermissions } from '../services/permission.resolver.js';
import { ApiError } from '../lib/ApiError.js';

export const PermissionMiddleware = (required, options = {}) => {
  const { mode = 'OR', requireService = false } = options;

  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Authentication required');
      }

      // Resolve once per request
      if (!req.user._resolved) {
        const { permissions, enabledServices } = await resolvePermissions(
          req.user,
        );

        req.user._resolvedPermissions = permissions;
        req.user._enabledServices = enabledServices;
        req.user._resolved = true;
      }

      const permissions = req.user._resolvedPermissions;
      const enabledServices = req.user._enabledServices;

      // SUPER ADMIN
      if (permissions.includes('*')) return next();

      // Normalize required → always array
      const requiredPermissions = Array.isArray(required)
        ? required
        : [required];

      // Permission check
      const hasPermission =
        mode === 'OR'
          ? requiredPermissions.some((p) => permissions.includes(p))
          : requiredPermissions.every((p) => permissions.includes(p));

      if (!hasPermission) {
        throw ApiError.forbidden('Permission denied');
      }

      if (requireService) {
        // Extract service from permission naming convention
        // Example: recharge.create → RECHARGE
        const requiredServices = requiredPermissions.map((p) =>
          p.split('.')[0].toUpperCase(),
        );

        const hasService =
          mode === 'OR'
            ? requiredServices.some((s) => enabledServices.includes(s))
            : requiredServices.every((s) => enabledServices.includes(s));

        if (!hasService) {
          throw ApiError.forbidden('Service not enabled for this user');
        }
      }

      return next();
    } catch (error) {
      next(error);
    }
  };
};
