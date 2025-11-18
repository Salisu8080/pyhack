/**
 * PyHack API Service
 * Handles all communication with the backend API
 */

class APIService {
  constructor() {
    // Auto-detect environment and use appropriate API URL
    this.baseURL = this.getAPIUrl();
    this.token = localStorage.getItem('pyhack-token');
  }

  /**
   * Get API URL based on environment
   * Priority: window.PYHACK_API_URL > environment detection > localhost
   */
  getAPIUrl() {
    // Allow manual override via global variable (set in index.html or config)
    if (window.PYHACK_API_URL) {
      return window.PYHACK_API_URL;
    }

    // Detect environment
    const hostname = window.location.hostname;

    // Production on Vercel
    if (hostname.includes('vercel.app')) {
      // TODO: Replace with your deployed backend URL
      // For now, return a placeholder - backend needs to be deployed
      return 'https://your-backend-url.herokuapp.com/api';
    }

    // Production on custom domain
    if (hostname === 'pyhack.com' || hostname === 'www.pyhack.com') {
      return 'https://api.pyhack.com/api';
    }

    // Development/localhost
    return 'http://localhost:5000/api';
  }

  // ==================== Helper Methods ====================

  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: this.getHeaders(options.requireAuth !== false),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('pyhack-token', token);
    } else {
      localStorage.removeItem('pyhack-token');
    }
  }

  getToken() {
    return this.token;
  }

  isAuthenticated() {
    return !!this.token;
  }

  // ==================== Authentication ====================

  async register(userData) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      requireAuth: false,
    });

    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async login(credentials) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      requireAuth: false,
    });

    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async logout() {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      });
    } finally {
      this.setToken(null);
    }
  }

  async getMe() {
    return await this.request('/auth/me');
  }

  async forgotPassword(email) {
    return await this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
      requireAuth: false,
    });
  }

  async resetPassword(token, password) {
    return await this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
      requireAuth: false,
    });
  }

  // ==================== User Profile ====================

  async getProfile() {
    return await this.request('/users/profile');
  }

  async updateProfile(profileData) {
    return await this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(passwordData) {
    return await this.request('/users/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  }

  async getStats() {
    return await this.request('/users/stats');
  }

  // ==================== Challenges ====================

  async getChallenges() {
    return await this.request('/challenges', {
      requireAuth: false,
    });
  }

  async getChallenge(id) {
    return await this.request(`/challenges/${id}`, {
      requireAuth: false,
    });
  }

  async submitChallenge(challengeId, submissionData) {
    return await this.request(`/challenges/${challengeId}/submit`, {
      method: 'POST',
      body: JSON.stringify(submissionData),
    });
  }

  async getProgress() {
    return await this.request('/challenges/progress/all');
  }

  async resetProgress(challengeId) {
    return await this.request(`/challenges/${challengeId}/progress`, {
      method: 'DELETE',
    });
  }

  // ==================== Leaderboard ====================

  async getGlobalLeaderboard(limit = 10) {
    return await this.request(`/leaderboard/global?limit=${limit}`, {
      requireAuth: false,
    });
  }

  async getWeeklyLeaderboard(limit = 10) {
    return await this.request(`/leaderboard/weekly?limit=${limit}`, {
      requireAuth: false,
    });
  }

  // ==================== Achievements ====================

  async getAchievements() {
    return await this.request('/achievements', {
      requireAuth: false,
    });
  }

  async getUserAchievements() {
    return await this.request('/achievements/user');
  }

  // ==================== Admin ====================

  async adminGetUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await this.request(`/admin/users?${query}`);
  }

  async adminGetUser(userId) {
    return await this.request(`/admin/users/${userId}`);
  }

  async adminUpdateUser(userId, userData) {
    return await this.request(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async adminDeleteUser(userId) {
    return await this.request(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async adminToggleUserStatus(userId) {
    return await this.request(`/admin/users/${userId}/status`, {
      method: 'PATCH',
    });
  }

  async adminGetChallenges() {
    return await this.request('/admin/challenges');
  }

  async adminCreateChallenge(challengeData) {
    return await this.request('/admin/challenges', {
      method: 'POST',
      body: JSON.stringify(challengeData),
    });
  }

  async adminUpdateChallenge(challengeId, challengeData) {
    return await this.request(`/admin/challenges/${challengeId}`, {
      method: 'PUT',
      body: JSON.stringify(challengeData),
    });
  }

  async adminDeleteChallenge(challengeId) {
    return await this.request(`/admin/challenges/${challengeId}`, {
      method: 'DELETE',
    });
  }

  async adminGetAnalytics() {
    return await this.request('/admin/analytics/overview');
  }

  async adminGetUserGrowth(period = 'daily') {
    return await this.request(`/admin/analytics/user-growth?period=${period}`);
  }

  async adminGetSettings() {
    return await this.request('/admin/settings');
  }

  async adminUpdateSetting(key, value) {
    return await this.request(`/admin/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  }
}

// Create a singleton instance
const api = new APIService();
