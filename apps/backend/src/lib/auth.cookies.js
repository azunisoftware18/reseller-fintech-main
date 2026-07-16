const isProd = process.env.NODE_ENV === 'production';

export const accessCookieOptions = (req) => ({
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  path: '/',
  domain: getCookieDomain(req.hostname), // 🔥 THIS LINE FIXES EVERYTHING
  maxAge: 24 * 60 * 60 * 1000, // 1 day
});

export const refreshCookieOptions = (req) => ({
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  path: '/',
  domain: getCookieDomain(req.hostname),
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

const getCookieDomain = (hostname) => {
  if (!hostname || hostname === 'localhost') return undefined;

  const parts = hostname.split('.');

  // azzunique.cloud / primewebdev.in
  if (parts.length === 2) return hostname;

  // api.azzunique.cloud / www.primewebdev.in
  return parts.slice(-2).join('.');
};
