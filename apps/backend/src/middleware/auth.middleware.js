import jwt from 'jsonwebtoken';
import { ApiError } from '../lib/ApiError.js';
import { deriveTenantOwnership } from '../lib/actor.utils.js';
import {
  accessCookieOptions,
  refreshCookieOptions,
} from '../lib/auth.cookies.js';

export const AuthMiddleware = async (req, res, next) => {
  try {
    let token;

    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw ApiError.unauthorized('Authentication token missing');
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    if (!decoded?.sub || !decoded?.tenantId || !decoded?.type) {
      throw ApiError.unauthorized('Invalid token payload');
    }

    req.user = {
      id: decoded.sub,
      tenantId: decoded.tenantId,
      type: decoded.type,
      roleCode: decoded.roleCode,
      roleLevel: decoded.roleLevel,
      roleId: decoded.type === 'USER' ? decoded.roleId : null,
      departmentId: decoded.type === 'EMPLOYEE' ? decoded.departmentId : null,
    };

    const ownership = await deriveTenantOwnership(req.user);
    req.user.isTenantOwner = ownership.isTenantOwner;
    req.user.ownedTenantId = ownership.ownedTenantId;

    next();
  } catch (err) {
    // 🔥 CRITICAL FIX: CLEAR COOKIES HERE
    res
      .clearCookie('accessToken', accessCookieOptions(req))
      .clearCookie('refreshToken', refreshCookieOptions(req));

    // Send response directly (DO NOT call next)
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }

    if (err instanceof ApiError) {
      return res.status(err.statusCode).json({ message: err.message });
    }

    return res.status(401).json({ message: 'Unauthorized' });
  }
};
