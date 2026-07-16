import { ApiError } from '../lib/ApiError.js';

export function assertRoleAllowed(actor, allowedRoles) {
  if (!allowedRoles.includes(actor.roleCode)) {
    throw ApiError.forbidden('Not allowed');
  }
}
