import PancardCallbackService from '../../services/pancard/pancard-callback.service.js';

export const pancardCallback = async (req, res) => {
  // 🔥 Always FAST ACK to provider
  res.json({ success: true });

  const clientIp =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;

  setImmediate(() => {
    PancardCallbackService.handle({
      body: req.body,
      query: req.query,
      headers: req.headers,
      ip: clientIp,
      rawBody: req.rawBody || '',
    }).catch((err) => {
      console.error('[PancardCallbackService Error]', err);
    });
  });
};
