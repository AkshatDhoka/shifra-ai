/**
 * SHIFRA AI - CLIENT CONTROLLER (PHASE 1)
 * Handles transitions, 3D flip card, real-time validations, and login/register network operations.
 */
document.addEventListener('DOMContentLoaded', () => {
  // --- View Containers & Navigation ---
  const welcomeView = document.getElementById('welcome-view');
  const authView = document.getElementById('auth-view');
  const btnEnter = document.getElementById('btn-enter');
  
  const authCard = document.getElementById('auth-card');
  const goToSignup = document.getElementById('go-to-signup');
  const goToLogin = document.getElementById('go-to-login');
  
  // Initialize Transition: Welcome View -> Auth View
  btnEnter.addEventListener('click', () => {
    welcomeView.classList.remove('active');
    setTimeout(() => {
      authView.classList.add('active');
      showToast('Assistant Initialized. Secure Authentication Panel ready.', 'info');
    }, 450); // Matches transition CSS timeout
  });
  
  // Transition Auth Card: Login to Signup (3D Flip)
  goToSignup.addEventListener('click', (e) => {
    e.preventDefault();
    clearValidationErrors();
    authCard.classList.add('flipped');
  });
  
  // Transition Auth Card: Signup to Login (3D Flip)
  goToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    clearValidationErrors();
    authCard.classList.remove('flipped');
  });

  // --- Form & Input Elements ---
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  
  const loginUser = document.getElementById('login-username');
  const loginPass = document.getElementById('login-password');
  
  const regUser = document.getElementById('reg-username');
  const regPass = document.getElementById('reg-password');
  const regConfirm = document.getElementById('reg-confirm-password');
  
  const strengthBar = document.getElementById('strength-bar');
  const strengthText = document.getElementById('strength-text');
  
  // --- Password Strength Evaluator (Real-Time) ---
  regPass.addEventListener('input', () => {
    const password = regPass.value;
    const strength = evaluatePassword(password);
    
    if (password.length === 0) {
      strengthBar.style.width = '0%';
      strengthText.textContent = 'Empty';
      strengthText.style.color = 'var(--text-muted)';
      return;
    }
    
    let width = '0%';
    let label = 'Weak';
    let color = 'var(--color-error)';
    
    if (strength === 1) {
      width = '33%';
      label = 'Weak';
      color = 'var(--color-error)';
    } else if (strength === 2) {
      width = '66%';
      label = 'Medium';
      color = 'var(--color-warning)';
    } else if (strength >= 3) {
      width = '100%';
      label = 'Strong';
      color = 'var(--color-success)';
    }
    
    strengthBar.style.width = width;
    strengthBar.style.backgroundColor = color;
    strengthText.textContent = label;
    strengthText.style.color = color;
  });
  
  /**
   * Helper function to score password strength.
   * Rules: Length >= 8, lower/upper mix, digits, special chars.
   */
  function evaluatePassword(password) {
    if (password.length === 0) return 0;
    let score = 0;
    
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score <= 1) return 1; // Weak
    if (score === 2 || score === 3) return 2; // Medium
    return 3; // Strong
  }

  // --- Confirm Password Match Check (Real-Time) ---
  regConfirm.addEventListener('input', () => {
    validatePasswordMatch();
  });
  
  function validatePasswordMatch() {
    const errorSpan = document.getElementById('reg-confirm-error');
    if (regConfirm.value !== regPass.value && regConfirm.value.length > 0) {
      showFieldError(regConfirm, errorSpan, 'Passwords do not match.');
      return false;
    } else {
      hideFieldError(regConfirm, errorSpan);
      return true;
    }
  }

  // --- Field Error Visual Setters ---
  function showFieldError(inputEl, errorEl, message) {
    inputEl.classList.add('invalid');
    errorEl.textContent = message;
    errorEl.classList.add('visible');
  }
  
  function hideFieldError(inputEl, errorEl) {
    inputEl.classList.remove('invalid');
    errorEl.textContent = '';
    errorEl.classList.remove('visible');
  }
  
  function clearValidationErrors() {
    const errors = document.querySelectorAll('.error-msg');
    errors.forEach(err => err.classList.remove('visible'));
    
    const inputs = document.querySelectorAll('input.invalid');
    inputs.forEach(input => input.classList.remove('invalid'));
  }
  
  function shakeElement(element) {
    element.classList.add('shake-error');
    setTimeout(() => {
      element.classList.remove('shake-error');
    }, 450);
  }

  // --- Toast Notification Engine ---
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Choose icons
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    } else {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-cyan)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }
    
    toast.innerHTML = `
      ${iconSvg}
      <div class="toast-message">${message}</div>
      <div class="toast-close">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </div>
    `;
    
    container.appendChild(toast);
    
    // Manual Close
    toast.querySelector('.toast-close').addEventListener('click', () => {
      removeToast(toast);
    });
    
    // Auto Dismiss
    setTimeout(() => {
      removeToast(toast);
    }, 4500);
  }
  
  function removeToast(toast) {
    if (toast.parentNode) {
      toast.classList.add('toast-out');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 500);
    }
  }

  // --- Network API Handlers & Form Submissions ---

  // Handle Login Submit
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearValidationErrors();
    
    let hasError = false;
    
    // Field Validations
    if (!loginUser.value.trim()) {
      showFieldError(loginUser, loginUser.nextElementSibling.nextElementSibling.nextElementSibling, 'Username is required.');
      shakeElement(loginUser.parentElement);
      hasError = true;
    }
    
    if (!loginPass.value) {
      showFieldError(loginPass, loginPass.nextElementSibling.nextElementSibling.nextElementSibling, 'Password is required.');
      shakeElement(loginPass.parentElement);
      hasError = true;
    }
    
    if (hasError) return;
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUser.value,
          password: loginPass.value
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        showToast(data.error || 'Login failed.', 'error');
        shakeElement(authCard);
      } else {
        showToast(`Welcome back, ${data.username}! Session authenticated successfully.`, 'success');
        localStorage.setItem('shifra_token', data.token);
        localStorage.setItem('shifra_user', data.username);
        
        // Reset fields
        loginUser.value = '';
        loginPass.value = '';
      }
    } catch (err) {
      console.error(err);
      showToast('Network error, please check server status.', 'error');
    }
  });

  // Handle Register Submit
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearValidationErrors();
    
    let hasError = false;
    const username = regUser.value.trim();
    const password = regPass.value;
    const confirmPassword = regConfirm.value;
    
    // Username requirements
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    const usernameErr = document.getElementById('reg-username-error');
    
    if (!username) {
      showFieldError(regUser, usernameErr, 'Username is required.');
      shakeElement(regUser.parentElement);
      hasError = true;
    } else if (!usernameRegex.test(username)) {
      showFieldError(regUser, usernameErr, 'Username must be 3-20 characters (alphanumeric and underscores).');
      shakeElement(regUser.parentElement);
      hasError = true;
    }
    
    // Password requirements
    const passwordErr = document.getElementById('reg-password-error');
    if (!password) {
      showFieldError(regPass, passwordErr, 'Password is required.');
      shakeElement(regPass.parentElement);
      hasError = true;
    } else if (password.length < 8) {
      showFieldError(regPass, passwordErr, 'Password must be at least 8 characters long.');
      shakeElement(regPass.parentElement);
      hasError = true;
    } else if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      showFieldError(regPass, passwordErr, 'Password must include uppercase, lowercase, and numeric characters.');
      shakeElement(regPass.parentElement);
      hasError = true;
    }
    
    // Confirm password match
    const confirmErr = document.getElementById('reg-confirm-error');
    if (!confirmPassword) {
      showFieldError(regConfirm, confirmErr, 'Please confirm your password.');
      shakeElement(regConfirm.parentElement);
      hasError = true;
    } else if (!validatePasswordMatch()) {
      shakeElement(regConfirm.parentElement);
      hasError = true;
    }
    
    if (hasError) return;
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        showToast(data.error || 'Registration failed.', 'error');
        shakeElement(authCard);
      } else {
        showToast('Registration successful! Logging you in...', 'success');
        localStorage.setItem('shifra_token', data.token);
        localStorage.setItem('shifra_user', data.username);
        
        // Reset fields
        regUser.value = '';
        regPass.value = '';
        regConfirm.value = '';
        strengthBar.style.width = '0%';
        strengthText.textContent = 'Empty';
        
        // Auto toggle screen back to login side
        setTimeout(() => {
          authCard.classList.remove('flipped');
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      showToast('Network error, please check server status.', 'error');
    }
  });
});
