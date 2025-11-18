/**
 * PyHack Authentication UI
 * Handles authentication modals and user interface
 */

class AuthUI {
  constructor(apiService) {
    this.api = apiService;
    this.currentUser = null;
  }

  // ==================== Initialization ====================

  async init() {
    // Check if user is already authenticated
    if (this.api.isAuthenticated()) {
      try {
        await this.loadCurrentUser();
        this.updateAuthUI();
      } catch (error) {
        console.error('Failed to load user:', error);
        this.api.setToken(null);
        this.updateAuthUI();
      }
    } else {
      this.updateAuthUI();
    }

    // Set up event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => this.handleRegister(e));
    }

    // Switch between login and register
    const showRegisterBtn = document.getElementById('show-register');
    if (showRegisterBtn) {
      showRegisterBtn.addEventListener('click', () => this.showRegisterModal());
    }

    const showLoginBtn = document.getElementById('show-login');
    if (showLoginBtn) {
      showLoginBtn.addEventListener('click', () => this.showLoginModal());
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }
  }

  // ==================== User Management ====================

  async loadCurrentUser() {
    try {
      const response = await this.api.getMe();
      this.currentUser = response.user;
      return this.currentUser;
    } catch (error) {
      console.error('Error loading current user:', error);
      throw error;
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return !!this.currentUser;
  }

  isAdmin() {
    return this.currentUser && (this.currentUser.role === 'ADMIN' || this.currentUser.role === 'SUPER_ADMIN');
  }

  // ==================== Authentication Handlers ====================

  async handleLogin(event) {
    event.preventDefault();

    const identifier = document.getElementById('login-identifier').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    const submitBtn = document.getElementById('login-submit-btn');

    // Clear previous errors
    errorEl.classList.add('d-none');
    errorEl.textContent = '';

    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Logging in...';

    try {
      const response = await this.api.login({ identifier, password });

      // Load user data
      await this.loadCurrentUser();

      // Update UI
      this.updateAuthUI();

      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
      if (modal) modal.hide();

      // Show success message
      this.showToast('Success', 'Welcome back! You are now logged in.', 'success');

      // Reload challenges and progress
      if (window.loadChallengesFromBackend) {
        await window.loadChallengesFromBackend();
      }

      // Reset form
      document.getElementById('login-form').reset();
    } catch (error) {
      errorEl.textContent = error.message || 'Login failed. Please check your credentials.';
      errorEl.classList.remove('d-none');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Login';
    }
  }

  async handleRegister(event) {
    event.preventDefault();

    const email = document.getElementById('register-email').value;
    const username = document.getElementById('register-username').value;
    const firstName = document.getElementById('register-firstname').value;
    const lastName = document.getElementById('register-lastname').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const errorEl = document.getElementById('register-error');
    const submitBtn = document.getElementById('register-submit-btn');

    // Clear previous errors
    errorEl.classList.add('d-none');
    errorEl.textContent = '';

    // Validate passwords match
    if (password !== confirmPassword) {
      errorEl.textContent = 'Passwords do not match.';
      errorEl.classList.remove('d-none');
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      errorEl.textContent = 'Password must be at least 6 characters long.';
      errorEl.classList.remove('d-none');
      return;
    }

    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating account...';

    try {
      const response = await this.api.register({
        email,
        username,
        firstName,
        lastName,
        password,
      });

      // Load user data
      await this.loadCurrentUser();

      // Update UI
      this.updateAuthUI();

      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
      if (modal) modal.hide();

      // Show success message
      this.showToast('Success', 'Account created successfully! Welcome to PyHack!', 'success');

      // Reload challenges and progress
      if (window.loadChallengesFromBackend) {
        await window.loadChallengesFromBackend();
      }

      // Reset form
      document.getElementById('register-form').reset();
    } catch (error) {
      errorEl.textContent = error.message || 'Registration failed. Please try again.';
      errorEl.classList.remove('d-none');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-user-plus me-2"></i>Create Account';
    }
  }

  async handleLogout() {
    try {
      await this.api.logout();
      this.currentUser = null;
      this.updateAuthUI();

      // Show success message
      this.showToast('Success', 'You have been logged out.', 'info');

      // Reload page to reset state
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
      this.showToast('Error', 'Failed to logout. Please try again.', 'danger');
    }
  }

  // ==================== UI Updates ====================

  updateAuthUI() {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');

    if (this.isAuthenticated()) {
      // Hide auth buttons, show user menu
      if (authButtons) authButtons.classList.add('d-none');
      if (userMenu) {
        userMenu.classList.remove('d-none');

        // Update user display
        const userDisplay = document.getElementById('user-display-name');
        if (userDisplay) {
          userDisplay.textContent = this.currentUser.username;
        }

        // Show/hide admin link
        const adminLink = document.getElementById('admin-link');
        if (adminLink) {
          if (this.isAdmin()) {
            adminLink.classList.remove('d-none');
          } else {
            adminLink.classList.add('d-none');
          }
        }
      }
    } else {
      // Show auth buttons, hide user menu
      if (authButtons) authButtons.classList.remove('d-none');
      if (userMenu) userMenu.classList.add('d-none');
    }
  }

  // ==================== Modal Management ====================

  showLoginModal() {
    const registerModal = bootstrap.Modal.getInstance(document.getElementById('registerModal'));
    if (registerModal) registerModal.hide();

    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    loginModal.show();
  }

  showRegisterModal() {
    const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
    if (loginModal) loginModal.hide();

    const registerModal = new bootstrap.Modal(document.getElementById('registerModal'));
    registerModal.show();
  }

  // ==================== Utilities ====================

  showToast(title, message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
      toastContainer.style.zIndex = '9999';
      document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toastId = `toast-${Date.now()}`;
    const toastHTML = `
      <div id="${toastId}" class="toast align-items-center text-white bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body">
            <strong>${title}</strong><br>
            ${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHTML);

    // Show toast
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: 5000 });
    toast.show();

    // Remove toast element after it's hidden
    toastElement.addEventListener('hidden.bs.toast', () => {
      toastElement.remove();
    });
  }
}

// Create singleton instance
let authUI = null;

// Initialize after DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  // Wait for API service to be available
  if (typeof api !== 'undefined') {
    authUI = new AuthUI(api);
    await authUI.init();
  }
});
