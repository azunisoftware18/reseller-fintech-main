export const httpResponseFilter = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (payload) => {
    // ❌ error responses untouched
    if (payload?.success === false) {
      return originalJson(payload);
    }

    const message = payload?.message ?? 'Success';

    const data =
      payload && typeof payload === 'object' && 'data' in payload
        ? payload.data
        : payload;

    const meta =
      payload && typeof payload === 'object' && 'meta' in payload
        ? payload.meta
        : undefined;

    return originalJson({
      success: true,
      message,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      data,
      ...(meta && { meta }),
    });
  };

  next();
};
