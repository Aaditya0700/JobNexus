const rateLimit = require('express-rate-limit');

// Limit login/register attempts to slow down brute-force attacks.
// 20 requests per 15 minutes per IP is suitable for a college MVP.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
});

module.exports = { authLimiter };
