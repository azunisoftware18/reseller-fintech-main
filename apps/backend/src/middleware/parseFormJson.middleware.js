/**
 * Parse JSON string fields in multipart/form-data body
 * Multer puts non-file fields as strings in req.body
 * This middleware parses fields that contain JSON strings
 */
export const parseFormJson = (fields = []) => {
  return (req, res, next) => {
    if (!req.body) return next();

    fields.forEach((field) => {
      if (req.body[field] && typeof req.body[field] === 'string') {
        try {
          req.body[field] = JSON.parse(req.body[field]);
        } catch (e) {
          // If parse fails, leave as-is (validation will catch it)
          console.warn(`[parseFormJson] Failed to parse ${field}:`, e.message);
        }
      }
    });

    next();
  };
};
