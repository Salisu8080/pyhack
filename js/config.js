/**
 * PyHack Configuration
 * Update this file with your deployed backend URL
 */

// Set your backend API URL here
// When backend is deployed, update this URL
window.PYHACK_CONFIG = {
  // Backend API URL (update after deploying backend)
  API_URL: null, // Set to null to use auto-detection

  // Or set explicitly:
  // API_URL: 'https://your-backend.herokuapp.com/api',
  // API_URL: 'https://your-backend.onrender.com/api',
  // API_URL: 'https://api.yourdomain.com/api',

  // Enable guest mode (works without backend)
  GUEST_MODE_ENABLED: true,

  // Show backend connection status
  SHOW_CONNECTION_STATUS: true,
};

// Apply configuration
if (window.PYHACK_CONFIG.API_URL) {
  window.PYHACK_API_URL = window.PYHACK_CONFIG.API_URL;
}
