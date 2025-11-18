require('dotenv').config();

module.exports = {
  secret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Token options
  options: {
    issuer: 'pyhack',
    audience: 'pyhack-users',
  },
};
