import authService from '../services/auth.service.js';
import {
  accessCookieOptions,
  refreshCookieOptions,
} from '../lib/auth.cookies.js';
import { serializeBigInt } from '../lib/lib.js';

export const login = async (req, res) => {
  const data = req.body;

  // Extract location + device data from request
  const locationData = {
    latitude: data.latitude,
    longitude: data.longitude,
    accuracy: data.accuracy,
    ipAddress:
      req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
  };

  const result =
    data.type === 'EMPLOYEE'
      ? await authService.loginEmployee(data, locationData)
      : await authService.loginUser(req.context, data, locationData);

  const { accessToken, refreshToken, ...rest } = result;

  res
    .cookie('accessToken', accessToken, accessCookieOptions(req))
    .cookie('refreshToken', refreshToken, refreshCookieOptions(req))
    .json(rest);
};

export const logout = async (req, res) => {
  await authService.logout({
    userId: req.user.id,
    type: req.user.type,
  });

  res
    .clearCookie('accessToken', accessCookieOptions(req))
    .clearCookie('refreshToken', refreshCookieOptions(req))
    .json({ data: null, message: 'logout success' });
};

export const getCurrentUser = async (req, res) => {
  const user = await authService.getCurrentUser(req.user);

  res.json({
    data: serializeBigInt(user),
    message: 'current user',
  });
};
