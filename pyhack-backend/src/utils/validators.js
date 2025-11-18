// Password strength validator
function validatePasswordStrength(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const checks = {
    minLength: password.length >= minLength,
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasSpecialChar
  };

  const strength = Object.values(checks).filter(Boolean).length;

  return {
    valid: checks.minLength && checks.hasLowerCase && (checks.hasUpperCase || checks.hasNumbers),
    strength: strength <= 2 ? 'weak' : strength <= 3 ? 'medium' : 'strong',
    checks
  };
}

// Email validator (basic)
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Username validator
function isValidUsername(username) {
  // 3-30 characters, alphanumeric only
  const usernameRegex = /^[a-zA-Z0-9]{3,30}$/;
  return usernameRegex.test(username);
}

module.exports = {
  validatePasswordStrength,
  isValidEmail,
  isValidUsername
};
