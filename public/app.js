/**
 * SHIFRA AI - CLIENT CONTROLLER (PHASES 1, 2, & 3)
 * Handles transitions, 3D flip card, real-time validations, email checks,
 * welcome overlay transition animations, markdown formatting, speech recognition,
 * speech synthesis (female voice optimization), dynamic multi-chat sessions,
 * billing plans, interactive checkout, UPI countdown, card mockup, theme selectors,
 * chat exports, server statistics dashboard, and glitch resets.
 */
document.addEventListener('DOMContentLoaded', () => {
  // --- View Containers & Navigation ---
  const welcomeView = document.getElementById('welcome-view');
  const authView = document.getElementById('auth-view');
  const workspaceView = document.getElementById('workspace-view');
  
  const btnEnter = document.getElementById('btn-enter');
  const btnLogout = document.getElementById('btn-logout');
  
  const authCard = document.getElementById('auth-card');
  const goToSignup = document.getElementById('go-to-signup');
  const goToLogin = document.getElementById('go-to-login');
  
  const accessOverlay = document.getElementById('access-overlay');
  const accessUsername = document.getElementById('access-username');

  // --- Workspace Elements ---
  const sidebarUsername = document.getElementById('sidebar-username');
  const userPlanBadge = document.getElementById('user-plan-badge');
  const userPlanExpiry = document.getElementById('user-plan-expiry');
  
  const chatFeed = document.getElementById('chat-feed');
  const chatPrompt = document.getElementById('chat-prompt');
  const btnSendMessage = document.getElementById('btn-send-message');
  const btnClearHistory = document.getElementById('btn-clear-history');
  const btnExportChat = document.getElementById('btn-export-chat');
  
  const btnNewChat = document.getElementById('btn-new-chat');
  const sidebarSessionsList = document.getElementById('sidebar-sessions-list');
  const btnUpgradePlan = document.getElementById('btn-upgrade-plan');
  
  // Voice Controls
  const voiceBubble = document.getElementById('voice-bubble');
  const btnMicDictate = document.getElementById('btn-mic-dictate');
  const speechStatusBar = document.getElementById('speech-status-bar');
  const speechStatusText = document.getElementById('speech-status-text');

  // --- Phase 3 Billing UI Elements ---
  const billingModal = document.getElementById('billing-modal');
  const btnCloseBilling = document.getElementById('btn-close-billing');
  
  const plansScreen = document.getElementById('billing-plans-screen');
  const checkoutScreen = document.getElementById('billing-checkout-screen');
  const processingScreen = document.getElementById('billing-processing-screen');
  const successScreen = document.getElementById('billing-success-screen');
  
  const pricingCycleCheckbox = document.getElementById('pricing-cycle-checkbox');
  const priceProValue = document.getElementById('price-pro-value');
  const priceProPeriod = document.getElementById('price-pro-period');
  const pricePremiumValue = document.getElementById('price-premium-value');
  const pricePremiumPeriod = document.getElementById('price-premium-period');
  
  const btnSelectPro = document.getElementById('btn-select-pro');
  const btnSelectPremium = document.getElementById('btn-select-premium');
  
  const btnBackToPlans = document.getElementById('btn-back-to-plans');
  const summaryPlanName = document.getElementById('summary-plan-name');
  const summaryPlanPeriod = document.getElementById('summary-plan-period');
  const summaryPlanPrice = document.getElementById('summary-plan-price');
  
  const tabBtnCard = document.getElementById('tab-btn-card');
  const tabBtnUpi = document.getElementById('tab-btn-upi');
  const cardTabContent = document.getElementById('payment-card-content');
  const upiTabContent = document.getElementById('payment-upi-content');
  
  // Interactive Card Fields
  const cardNumberInput = document.getElementById('card-number');
  const cardNameInput = document.getElementById('card-name');
  const cardExpiryInput = document.getElementById('card-expiry');
  const cardCvvInput = document.getElementById('card-cvv');
  
  const mockCardNumber = document.getElementById('mock-card-number');
  const mockCardName = document.getElementById('mock-card-name');
  const mockCardExpiry = document.getElementById('mock-card-expiry');
  
  const checkoutCardForm = document.getElementById('checkout-card-form');
  const btnVerifyUpiPayment = document.getElementById('btn-verify-upi-payment');
  const upiCountdownTimer = document.getElementById('upi-countdown-timer');
  const btnLaunchPremium = document.getElementById('btn-launch-premium');

  // --- Session Management State ---
  let activeSessionId = null;  // Current conversation ID
  
  // --- Voice / Speech Variables ---
  let isListeningMode = false; 
  let isDictating = false;     
  let recognition = null;      
  let activeSpeechUtterance = null; 

  // --- Billing State ---
  let selectedTier = 'pro';      
  let selectedCycle = 'monthly';  
  let selectedPrice = '$9.00';
  let upiTimer = null;

  // Initialize Speech Recognition if supported
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
  }

  // --- Theme Syncing ---
  const themeDots = document.querySelectorAll('.theme-dot');
  const savedTheme = localStorage.getItem('shifra_theme') || 'purple';
  applyThemeAccent(savedTheme);

  // Bind clicks to theme selector dots
  themeDots.forEach(dot => {
    dot.addEventListener('click', () => {
      const selectedAccent = dot.getAttribute('data-theme');
      applyThemeAccent(selectedAccent);
      showToast(`Interface accent updated to ${selectedAccent.toUpperCase()}.`, 'info');
    });
  });

  function applyThemeAccent(themeName) {
    // Reset body theme classes
    document.body.classList.remove('theme-purple', 'theme-green', 'theme-orange');
    
    // Add selected accent class
    if (themeName !== 'purple') {
      document.body.classList.add(`theme-${themeName}`);
    }

    // Set dot active state classes
    themeDots.forEach(dot => {
      if (dot.getAttribute('data-theme') === themeName) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    localStorage.setItem('shifra_theme', themeName);
  }

  // --- Real-time Stats dashboard updates ---
  setInterval(() => {
    const statsLatency = document.getElementById('stats-latency');
    if (statsLatency) {
      // Simulate real-world network fluctuations
      const randLatency = Math.floor(Math.random() * (165 - 110 + 1) + 110);
      statsLatency.textContent = `${randLatency}ms`;
    }
  }, 4000);

  let currentUptime = 99.982;
  setInterval(() => {
    const statsUptime = document.getElementById('stats-uptime');
    if (statsUptime) {
      currentUptime += (Math.random() - 0.5) * 0.001;
      if (currentUptime > 99.999) currentUptime = 99.995;
      if (currentUptime < 99.95) currentUptime = 99.982;
      statsUptime.textContent = `${currentUptime.toFixed(3)}%`;
    }
  }, 5000);

  // --- Session Loader ---
  const token = localStorage.getItem('shifra_token');
  const savedUser = localStorage.getItem('shifra_user');
  if (token && savedUser) {
    welcomeView.classList.remove('active');
    workspaceView.classList.add('active');
    initializeWorkspace(savedUser);
  }
  
  // Transition Welcome -> Auth
  btnEnter.addEventListener('click', () => {
    welcomeView.classList.remove('active');
    setTimeout(() => {
      authView.classList.add('active');
      showToast('Assistant Initialized. Secure Authentication Panel ready.', 'info');
    }, 450);
  });
  
  // Handle Logout
  btnLogout.addEventListener('click', () => {
    stopSpeaking();
    localStorage.removeItem('shifra_token');
    localStorage.removeItem('shifra_user');
    chatFeed.innerHTML = '';
    sidebarSessionsList.innerHTML = '';
    activeSessionId = null;
    
    workspaceView.classList.remove('active');
    setTimeout(() => {
      welcomeView.classList.add('active');
    }, 300);
    showToast('Logged out of secure session.', 'info');
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
  const regEmail = document.getElementById('reg-email');
  const regPass = document.getElementById('reg-password');
  const regConfirm = document.getElementById('reg-confirm-password');
  
  const strengthBar = document.getElementById('strength-bar');
  const strengthText = document.getElementById('strength-text');
  
  // --- Real-time Email Formatter ---
  regEmail.addEventListener('input', () => {
    validateEmailField();
  });

  function validateEmailField() {
    const email = regEmail.value.trim();
    const errorSpan = document.getElementById('reg-email-error');
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (email.length > 0 && !emailRegex.test(email)) {
      showFieldError(regEmail, errorSpan, 'Please enter a valid email address.');
      return false;
    } else {
      hideFieldError(regEmail, errorSpan);
      return true;
    }
  }

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
  
  function evaluatePassword(password) {
    if (password.length === 0) return 0;
    let score = 0;
    
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score <= 1) return 1;
    if (score === 2 || score === 3) return 2;
    return 3;
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
    let msg = message;
    let errSpan = errorEl;
    if (arguments.length === 2) {
      msg = errorEl;
      errSpan = inputEl.closest('.input-group').querySelector('.error-msg');
    }
    inputEl.classList.add('invalid');
    if (errSpan) {
      errSpan.textContent = msg;
      errSpan.classList.add('visible');
    }
  }
  
  function hideFieldError(inputEl, errorEl) {
    inputEl.classList.remove('invalid');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
    }
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

  // --- Welcome Transition Trigger ---
  function triggerWelcomeTransition(username) {
    accessUsername.textContent = username.toUpperCase();
    accessOverlay.classList.add('active');

    // Clear card inputs
    loginUser.value = '';
    loginPass.value = '';
    regUser.value = '';
    regEmail.value = '';
    regPass.value = '';
    regConfirm.value = '';
    strengthBar.style.width = '0%';
    strengthText.textContent = 'Empty';
    
    setTimeout(() => {
      authView.classList.remove('active');
      accessOverlay.classList.remove('active');
      authCard.classList.remove('flipped');
      
      setTimeout(() => {
        workspaceView.classList.add('active');
        initializeWorkspace(username);
        showToast(`Secure terminal initialized. Welcome Agent ${username}.`, 'success');
      }, 300);
    }, 3200);
  }

  // --- Password Visibility Toggle Interaction ---
  const passwordToggles = document.querySelectorAll('.password-toggle-btn');
  passwordToggles.forEach(toggleBtn => {
    toggleBtn.addEventListener('click', () => {
      const passwordInput = toggleBtn.parentElement.querySelector('input');
      const isPassType = passwordInput.type === 'password';
      passwordInput.type = isPassType ? 'text' : 'password';

      if (isPassType) {
        toggleBtn.innerHTML = `
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        `;
        toggleBtn.classList.add('visible-active');
      } else {
        toggleBtn.innerHTML = `
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        `;
        toggleBtn.classList.remove('visible-active');
      }
    });
  });

  // --- Toast Notification Engine ---
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
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
    
    toast.querySelector('.toast-close').addEventListener('click', () => {
      removeToast(toast);
    });
    
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

  // --- Auth Form Submissions ---

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearValidationErrors();
    let hasError = false;
    
    if (!loginUser.value.trim()) {
      showFieldError(loginUser, 'Username or email is required.');
      shakeElement(loginUser.closest('.input-group'));
      hasError = true;
    }
    
    if (!loginPass.value) {
      showFieldError(loginPass, 'Password is required.');
      shakeElement(loginPass.closest('.input-group'));
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
        localStorage.setItem('shifra_token', data.token);
        localStorage.setItem('shifra_user', data.username);
        triggerWelcomeTransition(data.username);
      }
    } catch (err) {
      console.error(err);
      showToast('Network error, please check server status.', 'error');
    }
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearValidationErrors();
    
    let hasError = false;
    const username = regUser.value.trim();
    const email = regEmail.value.trim();
    const password = regPass.value;
    const confirmPassword = regConfirm.value;
    
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!username) {
      showFieldError(regUser, 'Username is required.');
      shakeElement(regUser.closest('.input-group'));
      hasError = true;
    } else if (!usernameRegex.test(username)) {
      showFieldError(regUser, 'Username must be 3-20 characters (alphanumeric and underscores).');
      shakeElement(regUser.closest('.input-group'));
      hasError = true;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email) {
      showFieldError(regEmail, 'Email address is required.');
      shakeElement(regEmail.closest('.input-group'));
      hasError = true;
    } else if (!emailRegex.test(email)) {
      showFieldError(regEmail, 'Please enter a valid email address.');
      shakeElement(regEmail.closest('.input-group'));
      hasError = true;
    }
    
    if (!password) {
      showFieldError(regPass, 'Password is required.');
      shakeElement(regPass.closest('.input-group'));
      hasError = true;
    } else if (password.length < 8) {
      showFieldError(regPass, 'Password must be at least 8 characters long.');
      shakeElement(regPass.closest('.input-group'));
      hasError = true;
    } else if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      showFieldError(regPass, 'Password must include uppercase, lowercase, and numeric characters.');
      shakeElement(regPass.closest('.input-group'));
      hasError = true;
    }
    
    if (!confirmPassword) {
      showFieldError(regConfirm, 'Please confirm your password.');
      shakeElement(regConfirm.closest('.input-group'));
      hasError = true;
    } else if (!validatePasswordMatch()) {
      shakeElement(regConfirm.closest('.input-group'));
      hasError = true;
    }
    
    if (hasError) return;
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const data = await response.json();
      
      if (!response.ok) {
        showToast(data.error || 'Registration failed.', 'error');
        shakeElement(authCard);
      } else {
        localStorage.setItem('shifra_token', data.token);
        localStorage.setItem('shifra_user', data.username);
        triggerWelcomeTransition(data.username);
      }
    } catch (err) {
      console.error(err);
      showToast('Network error, please check server status.', 'error');
    }
  });


  // ==========================================
  // PHASE 2 - CORE WORKSPACE CONTROLLER
  // ==========================================

  /**
   * Initializes workspace UI states, loads chat history, and configures event bindings.
   */
  async function initializeWorkspace(username) {
    sidebarUsername.textContent = username;
    chatPrompt.value = '';
    adjustTextareaHeight();
    
    activeSessionId = 'session_' + Date.now();
    
    chatPrompt.focus();

    await loadSessionsList();
    await syncUserPlanDetails();
  }

  // --- Textarea Input Auto-Growing helper ---
  chatPrompt.addEventListener('input', adjustTextareaHeight);
  
  function adjustTextareaHeight() {
    chatPrompt.style.height = 'auto';
    chatPrompt.style.height = (chatPrompt.scrollHeight) + 'px';
  }

  // Send message on Enter key (without Shift)
  chatPrompt.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessageSubmit();
    }
  });

  btnSendMessage.addEventListener('click', handleSendMessageSubmit);

  /**
   * Handle user message submissions
   */
  async function handleSendMessageSubmit() {
    const promptText = chatPrompt.value.trim();
    if (!promptText) return;

    stopSpeaking();

    if (!activeSessionId) {
      activeSessionId = 'session_' + Date.now();
    }

    appendMessageToFeed('user', promptText);
    
    chatPrompt.value = '';
    chatPrompt.style.height = 'auto';

    const welcomeWrapper = document.getElementById('chat-welcome-cards');
    if (welcomeWrapper) {
      welcomeWrapper.remove();
    }

    const loaderId = appendTypingIndicator();
    scrollToBottom();

    try {
      const activeToken = localStorage.getItem('shifra_token');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({ 
          prompt: promptText,
          sessionId: activeSessionId
        })
      });

      const data = await response.json();
      
      removeTypingIndicator(loaderId);

      if (!response.ok) {
        appendMessageToFeed('assistant', `⚠️ **Error**: ${data.error || 'Could not fetch reply.'}`);
        showToast(data.error || 'Server error, check connections.', 'error');
      } else {
        appendMessageToFeed('assistant', data.response);
        await loadSessionsList();
        
        if (isListeningMode) {
          speakText(data.response);
        }
      }
      scrollToBottom();
    } catch (err) {
      console.error(err);
      removeTypingIndicator(loaderId);
      appendMessageToFeed('assistant', '⚠️ **Network Error**: Unable to contact the Shifra AI server.');
      showToast('Connection failed.', 'error');
      scrollToBottom();
    }
  }

  /**
   * Appends a message bubble in the feed
   */
  function appendMessageToFeed(role, text) {
    const messageRow = document.createElement('div');
    messageRow.className = `message-row ${role}-row`;
    
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    
    if (role === 'user') {
      bubble.textContent = text;
    } else {
      bubble.innerHTML = parseMarkdownToHtml(text);
      bindCopyCodeButtons(bubble);
    }
    
    messageRow.appendChild(bubble);
    chatFeed.appendChild(messageRow);
  }

  /**
   * Appends typing loading dots
   */
  function appendTypingIndicator() {
    const id = 'typing-' + Date.now();
    const row = document.createElement('div');
    row.className = 'message-row assistant-row';
    row.id = id;

    row.innerHTML = `
      <div class="message-bubble">
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;
    
    chatFeed.appendChild(row);
    return id;
  }

  function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  function scrollToBottom() {
    chatFeed.scrollTop = chatFeed.scrollHeight;
  }

  // --- Bind suggestion cards click to fill the prompt ---
  document.addEventListener('click', (e) => {
    const suggestionCard = e.target.closest('.suggestion-card');
    if (suggestionCard) {
      const textPrompt = suggestionCard.getAttribute('data-prompt');
      chatPrompt.value = textPrompt;
      adjustTextareaHeight();
      chatPrompt.focus();
    }
  });

  // --- Fetch past history logs for a specific session ---
  async function fetchSessionChatHistory(sessionId) {
    try {
      const activeToken = localStorage.getItem('shifra_token');
      const response = await fetch(`/api/chat/history/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      const data = await response.json();

      chatFeed.innerHTML = ''; 

      if (response.ok && data.history && data.history.length > 0) {
        data.history.forEach(msg => {
          appendMessageToFeed(msg.role, msg.message);
        });
        scrollToBottom();
      } else {
        renderWelcomeCards();
      }
    } catch (err) {
      console.error('Failed to load session history:', err);
      showToast('Could not load conversation logs.', 'error');
    }
  }

  // --- Load and Render Sessions List in Sidebar ---
  async function loadSessionsList() {
    try {
      const activeToken = localStorage.getItem('shifra_token');
      const response = await fetch('/api/chat/sessions', {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      const data = await response.json();

      if (response.ok && data.sessions) {
        sidebarSessionsList.innerHTML = '';
        
        if (data.sessions.length === 0) {
          sidebarSessionsList.innerHTML = '<div style="font-size:0.78rem; color:var(--text-muted); text-align:center; padding: 15px 0;">No active logs</div>';
          return;
        }

        data.sessions.forEach(session => {
          const sessionItem = document.createElement('div');
          sessionItem.className = 'session-item';
          if (session.session_id === activeSessionId) {
            sessionItem.classList.add('active');
          }
          sessionItem.setAttribute('data-id', session.session_id);
          
          let title = session.message || 'New Chat';
          if (title.length > 25) {
            title = title.substring(0, 25) + '...';
          }
          sessionItem.textContent = title;
          
          sessionItem.addEventListener('click', () => {
            switchSession(session.session_id);
          });

          sidebarSessionsList.appendChild(sessionItem);
        });
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    }
  }

  function switchSession(sessionId) {
    if (activeSessionId === sessionId) return;
    
    stopSpeaking();
    
    // Apply digital glitch clearing skew animations on switch
    chatFeed.classList.add('glitch-clearing');
    
    setTimeout(() => {
      activeSessionId = sessionId;
      
      const items = sidebarSessionsList.querySelectorAll('.session-item');
      items.forEach(item => {
        if (item.getAttribute('data-id') === sessionId) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });

      fetchSessionChatHistory(sessionId);
      chatFeed.classList.remove('glitch-clearing');
    }, 450);
  }

  // --- New Chat Button Trigger ---
  btnNewChat.addEventListener('click', () => {
    stopSpeaking();
    
    // Trigger clear glitch
    chatFeed.classList.add('glitch-clearing');
    
    setTimeout(() => {
      activeSessionId = 'session_' + Date.now();
      
      chatFeed.innerHTML = '';
      renderWelcomeCards();
      chatPrompt.value = '';
      chatPrompt.style.height = 'auto';
      chatPrompt.focus();

      const items = sidebarSessionsList.querySelectorAll('.session-item');
      items.forEach(item => item.classList.remove('active'));

      chatFeed.classList.remove('glitch-clearing');
      showToast('New secure session initialized.', 'info');
    }, 450);
  });

  // --- Delete Active Chat Handler ---
  btnClearHistory.addEventListener('click', async () => {
    if (!activeSessionId) {
      showToast('No active session selected.', 'warning');
      return;
    }

    if (!confirm('Are you sure you want to delete the active conversation? This cannot be undone.')) {
      return;
    }

    // Trigger clear glitch animation
    chatFeed.classList.add('glitch-clearing');

    setTimeout(async () => {
      try {
        const activeToken = localStorage.getItem('shifra_token');
        const response = await fetch(`/api/chat/history/${activeSessionId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${activeToken}` }
        });

        chatFeed.classList.remove('glitch-clearing');

        if (response.ok) {
          stopSpeaking();
          chatFeed.innerHTML = '';
          showToast('Active conversation deleted.', 'success');
          
          activeSessionId = 'session_' + Date.now();
          await loadSessionsList();
          renderWelcomeCards();
        } else {
          showToast('Could not delete conversation.', 'error');
        }
      } catch (err) {
        console.error(err);
        chatFeed.classList.remove('glitch-clearing');
        showToast('Delete query failed.', 'error');
      }
    }, 750);
  });

  function renderWelcomeCards() {
    const welcomeHTML = `
      <div id="chat-welcome-cards" class="chat-welcome-wrapper">
        <h3 class="welcome-chat-title">How can I help you today?</h3>
        <p class="welcome-chat-subtitle">Ask Shifra AI to review, explain, or write code. Use text or talk to the companion bubble below.</p>
        <div class="quick-cards-grid">
          <div class="suggestion-card" data-prompt="Explain how a binary search algorithm works and write it in Python.">
            <span class="card-icon">🧠</span>
            <span class="card-title">Explain Code</span>
            <span class="card-desc">"Explain how a binary search algorithm works..."</span>
          </div>
          <div class="suggestion-card" data-prompt="Review this JavaScript code snippet for performance bottlenecks and bugs.">
            <span class="card-icon">🔍</span>
            <span class="card-title">Code Review</span>
            <span class="card-desc">"Review this JavaScript snippet for bottlenecks..."</span>
          </div>
          <div class="suggestion-card" data-prompt="Write a Node.js Express server boilerplate using ESM imports.">
            <span class="card-icon">⚡</span>
            <span class="card-title">Write Boilerplate</span>
            <span class="card-desc">"Write a Node.js Express server boilerplate..."</span>
          </div>
          <div class="suggestion-card" data-prompt="Find potential security issues and syntax errors in this SQL query.">
            <span class="card-icon">🛡️</span>
            <span class="card-title">Find Bugs</span>
            <span class="card-desc">"Find potential security issues in this SQL..."</span>
          </div>
        </div>
      </div>
    `;
    chatFeed.innerHTML = welcomeHTML;
  }

  // ==========================================
  // EXPORT CONVERSATION TO MARKDOWN (.MD)
  // ==========================================
  btnExportChat.addEventListener('click', () => {
    const rows = chatFeed.querySelectorAll('.message-row');
    if (rows.length === 0 || (rows.length === 1 && rows[0].id === 'chat-welcome-cards')) {
      showToast('No active conversation logs to export.', 'warning');
      return;
    }

    let markdownText = `# Shifra AI Coding Companion - Chat Session Logs\n`;
    markdownText += `Generated on: ${new Date().toLocaleString()}\n`;
    markdownText += `Session ID: ${activeSessionId}\n\n`;
    markdownText += `---\n\n`;

    rows.forEach(row => {
      if (row.id === 'chat-welcome-cards') return;

      const bubble = row.querySelector('.message-bubble');
      if (!bubble) return;

      const isUser = row.classList.contains('user-row');
      const sender = isUser ? 'USER' : 'SHIFRA AI';
      
      let content = '';
      if (isUser) {
        content = bubble.textContent;
      } else {
        // Pull clean formatted text content out of parsed HTML blocks
        content = bubble.innerText;
        // Clean out 'Copy' button labels inside blocks
        content = content.replace(/\bCopy\b/g, '');
      }

      markdownText += `### **[${sender}]**\n${content.trim()}\n\n---\n\n`;
    });

    const blob = new Blob([markdownText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `shifra_chat_${activeSessionId}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Conversation exported successfully as Markdown.', 'success');
  });

  // ==========================================
  // PHASE 3 - BILLING & DYNAMIC GATEWAY CONTROLLER
  // ==========================================

  async function syncUserPlanDetails() {
    try {
      const activeToken = localStorage.getItem('shifra_token');
      if (!activeToken) return;

      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      const data = await response.json();

      if (response.ok && data.user) {
        const tier = data.user.plan_tier || 'free';
        const expiry = data.user.plan_expiry;

        userPlanBadge.className = 'plan-badge-mini';
        
        if (tier === 'pro') {
          userPlanBadge.textContent = 'PRO';
          userPlanBadge.classList.add('badge-pro');
        } else if (tier === 'premium') {
          userPlanBadge.textContent = 'PREMIUM';
          userPlanBadge.classList.add('badge-premium');
        } else {
          userPlanBadge.textContent = 'FREE';
          userPlanBadge.classList.add('badge-free');
        }

        if (tier === 'free' || !expiry) {
          userPlanExpiry.textContent = 'Active Session';
        } else {
          const date = new Date(expiry);
          const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
          userPlanExpiry.textContent = `Expires: ${formattedDate}`;
        }
      }
    } catch (err) {
      console.error('Failed to sync plan parameters:', err);
    }
  }

  btnUpgradePlan.addEventListener('click', () => {
    stopSpeaking();
    billingModal.classList.add('active');
    showBillingScreen(plansScreen);
  });

  btnCloseBilling.addEventListener('click', () => {
    closeBillingModalWindow();
  });

  function closeBillingModalWindow() {
    billingModal.classList.remove('active');
    clearInterval(upiTimer);
  }

  function showBillingScreen(screenEl) {
    const screens = [plansScreen, checkoutScreen, processingScreen, successScreen];
    screens.forEach(s => s.classList.remove('active'));
    screenEl.classList.add('active');
  }

  pricingCycleCheckbox.addEventListener('change', () => {
    const isYearly = pricingCycleCheckbox.checked;
    selectedCycle = isYearly ? 'yearly' : 'monthly';

    const monthlyLabels = document.querySelectorAll('.monthly-label');
    const yearlyLabels = document.querySelectorAll('.yearly-label');

    if (isYearly) {
      monthlyLabels.forEach(l => l.classList.remove('active'));
      yearlyLabels.forEach(l => l.classList.add('active'));

      priceProValue.textContent = '79';
      priceProPeriod.textContent = '/yr';
      pricePremiumValue.textContent = '249';
      pricePremiumPeriod.textContent = '/yr';
    } else {
      monthlyLabels.forEach(l => l.classList.add('active'));
      yearlyLabels.forEach(l => l.classList.remove('active'));

      priceProValue.textContent = '9';
      priceProPeriod.textContent = '/mo';
      pricePremiumValue.textContent = '29';
      pricePremiumPeriod.textContent = '/mo';
    }
  });

  btnSelectPro.addEventListener('click', () => {
    selectedTier = 'pro';
    selectedPrice = selectedCycle === 'yearly' ? '$79.00' : '$9.00';
    openCheckoutScreen('Shifra Go Pro', selectedCycle === 'yearly' ? 'Yearly billing' : 'Monthly billing', selectedPrice);
  });

  btnSelectPremium.addEventListener('click', () => {
    selectedTier = 'premium';
    selectedPrice = selectedCycle === 'yearly' ? '$249.00' : '$29.00';
    openCheckoutScreen('Shifra Premium Elite', selectedCycle === 'yearly' ? 'Yearly billing' : 'Monthly billing', selectedPrice);
  });

  function openCheckoutScreen(planName, planPeriod, planPrice) {
    summaryPlanName.textContent = planName;
    summaryPlanPeriod.textContent = planPeriod;
    summaryPlanPrice.textContent = planPrice;

    checkoutCardForm.reset();
    mockCardNumber.textContent = '•••• •••• •••• ••••';
    mockCardName.textContent = 'YOUR NAME';
    mockCardExpiry.textContent = 'MM/YY';

    showBillingScreen(checkoutScreen);
    activatePaymentTab('card'); 
  }

  btnBackToPlans.addEventListener('click', () => {
    clearInterval(upiTimer);
    showBillingScreen(plansScreen);
  });

  tabBtnCard.addEventListener('click', () => activatePaymentTab('card'));
  tabBtnUpi.addEventListener('click', () => activatePaymentTab('upi'));

  function activatePaymentTab(tabName) {
    clearInterval(upiTimer);

    if (tabName === 'card') {
      tabBtnCard.classList.add('active');
      tabBtnUpi.classList.remove('active');
      cardTabContent.classList.add('active');
      upiTabContent.classList.remove('active');
    } else {
      tabBtnCard.classList.remove('active');
      tabBtnUpi.classList.add('active');
      cardTabContent.classList.remove('active');
      upiTabContent.classList.add('active');
      startUpiCountdown();
    }
  }

  cardNumberInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let formatted = '';
    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += ' ';
      }
      formatted += value[i];
    }
    e.target.value = formatted;
    mockCardNumber.textContent = formatted || '•••• •••• •••• ••••';
  });

  cardNameInput.addEventListener('input', (e) => {
    mockCardName.textContent = e.target.value.toUpperCase() || 'YOUR NAME';
  });

  cardExpiryInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    e.target.value = value;
    mockCardExpiry.textContent = value || 'MM/YY';
  });

  function startUpiCountdown() {
    let totalSeconds = 300; 
    
    function tick() {
      let minutes = Math.floor(totalSeconds / 60);
      let seconds = totalSeconds % 60;
      
      let formattedSeconds = seconds < 10 ? '0' + seconds : seconds;
      let formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
      
      upiCountdownTimer.textContent = `Awaiting payment verification: ${formattedMinutes}:${formattedSeconds}`;
      
      if (totalSeconds <= 0) {
        clearInterval(upiTimer);
        upiCountdownTimer.textContent = 'Transaction QR Expired. Please reload checkout.';
      }
      totalSeconds--;
    }
    
    clearInterval(upiTimer);
    tick(); 
    upiTimer = setInterval(tick, 1000);
  }

  checkoutCardForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (cardNumberInput.value.length < 19) {
      showToast('Please enter a valid 16-digit card number.', 'error');
      shakeElement(cardNumberInput.closest('.input-wrapper'));
      return;
    }
    if (!cardNameInput.value.trim()) {
      showToast('Cardholder name is required.', 'error');
      shakeElement(cardNameInput.closest('.input-wrapper'));
      return;
    }
    if (cardExpiryInput.value.length < 5) {
      showToast('Please enter expiry details (MM/YY).', 'error');
      shakeElement(cardExpiryInput.closest('.input-wrapper'));
      return;
    }
    if (cardCvvInput.value.length < 3) {
      showToast('Please enter a valid 3-digit CVV.', 'error');
      shakeElement(cardCvvInput.closest('.input-wrapper'));
      return;
    }

    executePaymentSimulation();
  });

  btnVerifyUpiPayment.addEventListener('click', () => {
    clearInterval(upiTimer);
    executePaymentSimulation();
  });

  function executePaymentSimulation() {
    showBillingScreen(processingScreen);

    const log1 = document.getElementById('billing-log-line-1');
    const log2 = document.getElementById('billing-log-line-2');
    const log3 = document.getElementById('billing-log-line-3');
    const log4 = document.getElementById('billing-log-line-4');

    const logs = [log1, log2, log3, log4];
    logs.forEach(l => {
      l.textContent = '';
      l.className = 'terminal-log-line';
    });

    setTimeout(() => {
      log1.textContent = '➔ [1/4] Establishing secure handshake with payment ledger...';
      log1.classList.add('visible');
    }, 500);

    setTimeout(() => {
      log2.textContent = '➔ [2/4] Verifying token signature and authorization...';
      log2.classList.add('visible');
    }, 1500);

    setTimeout(() => {
      log3.textContent = '➔ [3/4] Recording transaction in PostgreSQL database...';
      log3.classList.add('visible');
    }, 2500);

    setTimeout(() => {
      log4.textContent = '✔ [4/4] Activating subscription claims on user token...';
      log4.classList.add('visible', 'log-success');
    }, 3500);

    setTimeout(async () => {
      try {
        const activeToken = localStorage.getItem('shifra_token');
        const response = await fetch('/api/billing/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${activeToken}`
          },
          body: JSON.stringify({
            planTier: selectedTier,
            planDuration: selectedCycle
          })
        });

        const data = await response.json();
        
        if (response.ok) {
          showSuccessScreen();
        } else {
          showToast(data.error || 'Payment failed on server database update.', 'error');
          showBillingScreen(checkoutScreen);
        }
      } catch (err) {
        console.error(err);
        showToast('Connection failed during payment verification.', 'error');
        showBillingScreen(checkoutScreen);
      }
    }, 4600);
  }

  function showSuccessScreen() {
    const successTitle = document.getElementById('billing-success-title');
    const successSubtitle = document.getElementById('billing-success-subtitle');

    const tierName = selectedTier === 'premium' ? 'Premium Elite' : 'Go Pro';
    const periodName = selectedCycle === 'yearly' ? '1 Year' : '1 Month';

    successTitle.textContent = 'UPGRADE SUCCESSFUL!';
    successSubtitle.textContent = `Welcome to Shifra ${tierName} (${periodName} plan). Your secure AI workspace coding limits have been updated.`;

    showBillingScreen(successScreen);
    showToast('Plan upgraded successfully!', 'success');
  }

  btnLaunchPremium.addEventListener('click', async () => {
    await syncUserPlanDetails();
    btnNewChat.click();
    closeBillingModalWindow();
  });


  // ==========================================
  // VOICE CONTROL ENGINE (SpeechRecognition & SpeechSynthesis)
  // ==========================================

  voiceBubble.addEventListener('click', () => {
    if (!recognition) {
      showToast('Speech recognition not supported in this browser. Please use Chrome.', 'warning');
      return;
    }

    if (isListeningMode) {
      deactivateVoiceCompanion();
    } else {
      activateVoiceCompanion();
    }
  });

  btnMicDictate.addEventListener('click', () => {
    if (!recognition) {
      showToast('Speech recognition not supported in this browser.', 'warning');
      return;
    }

    if (isListeningMode) {
      deactivateVoiceCompanion();
    }

    if (isDictating) {
      stopSpeechRecognition();
    } else {
      startDictationMic();
    }
  });

  function activateVoiceCompanion() {
    isListeningMode = true;
    voiceBubble.classList.add('listening');
    speechStatusBar.classList.add('active');
    speechStatusText.textContent = 'Voice Companion Active: Listening...';
    
    stopSpeaking();
    startSpeechRecognition();
  }

  function deactivateVoiceCompanion() {
    isListeningMode = false;
    voiceBubble.className = 'voice-bubble-widget'; 
    speechStatusBar.classList.remove('active');
    
    stopSpeechRecognition();
    stopSpeaking();
  }

  function startDictationMic() {
    isDictating = true;
    btnMicDictate.classList.add('recording-active');
    showToast('Dictation mic active. Start speaking...', 'info');
    
    startSpeechRecognition();
  }

  function stopSpeechRecognition() {
    if (recognition) {
      recognition.stop();
    }
    isDictating = false;
    btnMicDictate.classList.remove('recording-active');
  }

  function startSpeechRecognition() {
    if (!recognition) return;
    
    try {
      recognition.start();
    } catch (e) {
      // Catch start attempts
    }
  }

  if (recognition) {
    recognition.onstart = () => {
      console.log('Voice engine active.');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log('Speech captured:', transcript);

      if (isListeningMode) {
        chatPrompt.value = transcript;
        adjustTextareaHeight();
        speechStatusText.textContent = 'Speech Captured. Decoding...';
        handleSendMessageSubmit();
      } else if (isDictating) {
        const currentText = chatPrompt.value;
        chatPrompt.value = currentText + (currentText ? ' ' : '') + transcript;
        adjustTextareaHeight();
        chatPrompt.focus();
        stopSpeechRecognition();
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        if (isListeningMode) {
          startSpeechRecognition();
        }
      } else {
        deactivateVoiceCompanion();
        showToast('Speech recognition error: ' + event.error, 'error');
      }
    };

    recognition.onend = () => {
      console.log('Voice engine inactive.');
      if (isListeningMode && !voiceBubble.classList.contains('speaking')) {
        startSpeechRecognition();
      }
      
      if (isDictating) {
        isDictating = false;
        btnMicDictate.classList.remove('recording-active');
      }
    };
  }

  function speakText(rawText) {
    if (!window.speechSynthesis) return;

    const speakableText = cleanTextForSpeech(rawText);
    stopSpeaking();

    activeSpeechUtterance = new SpeechSynthesisUtterance(speakableText);
    
    const voices = window.speechSynthesis.getVoices();
    const femaleVoiceKeywords = ['zira', 'samantha', 'karen', 'tessa', 'hazel', 'moira', 'susan', 'female', 'google us english'];
    
    let femaleVoice = voices.find(voice => {
      const nameLower = voice.name.toLowerCase();
      return voice.lang.startsWith('en') && femaleVoiceKeywords.some(keyword => nameLower.includes(keyword));
    });
    
    if (!femaleVoice) {
      femaleVoice = voices.find(v => v.lang.startsWith('en'));
    }

    if (femaleVoice) {
      activeSpeechUtterance.voice = femaleVoice;
    }
    
    activeSpeechUtterance.pitch = 1.15;
    activeSpeechUtterance.rate = 1.0;

    activeSpeechUtterance.onstart = () => {
      if (recognition && isListeningMode) {
        recognition.stop();
      }
      voiceBubble.classList.add('speaking');
      speechStatusText.textContent = 'Voice Companion: Speaking...';
    };

    activeSpeechUtterance.onend = () => {
      voiceBubble.classList.remove('speaking');
      activeSpeechUtterance = null;

      if (isListeningMode) {
        speechStatusText.textContent = 'Voice Companion: Listening...';
        startSpeechRecognition();
      }
    };

    activeSpeechUtterance.onerror = (e) => {
      console.error('TTS error:', e);
      voiceBubble.classList.remove('speaking');
      activeSpeechUtterance = null;
      if (isListeningMode) {
        startSpeechRecognition();
      }
    };

    window.speechSynthesis.speak(activeSpeechUtterance);
  }

  function stopSpeaking() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    voiceBubble.classList.remove('speaking');
    activeSpeechUtterance = null;
  }

  function cleanTextForSpeech(text) {
    let cleaned = text.replace(/```[\s\S]*?```/g, '[Code snippet omitted]');
    cleaned = cleaned.replace(/`([^`]+)`/g, '$1')
                     .replace(/\*\*([^*]+)\*\*/g, '$1')
                     .replace(/\*([^*]+)\*/g, '$1')
                     .replace(/#+\s+/g, '')
                     .replace(/[-*]\s+/g, '')
                     .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); 
                     
    return cleaned.trim();
  }


  // ==========================================
  // CUSTOM MARKDOWN ENGINE (HTML PARSER)
  // ==========================================

  function parseMarkdownToHtml(markdownText) {
    if (!markdownText) return '';

    let html = markdownText;

    html = html.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;');

    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    html = html.replace(codeBlockRegex, (match, language, code) => {
      const displayLang = language || 'code';
      const cleanCode = code.trim();
      
      return `
        <div class="code-header">
          <span>${displayLang.toUpperCase()}</span>
          <button type="button" class="btn-copy-code">Copy</button>
        </div>
        <pre><code class="language-${displayLang}">${cleanCode}</code></pre>
      `;
    });

    html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>')
               .replace(/^## (.*?)$/gm, '<h3>$1</h3>')
               .replace(/^# (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/^\s*[-*]\s+(.*?)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*?<\/li>)/s, '<ul>$1</ul>');
    html = html.replace(/\n\n/g, '<br><br>');

    return html;
  }

  function bindCopyCodeButtons(bubbleElement) {
    const copyBtns = bubbleElement.querySelectorAll('.btn-copy-code');
    copyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const preElement = btn.closest('.code-header').nextElementSibling;
        if (preElement && preElement.tagName === 'PRE') {
          const codeText = preElement.querySelector('code').textContent;
          
          navigator.clipboard.writeText(codeText)
            .then(() => {
              btn.textContent = 'Copied!';
              showToast('Code snippet copied to clipboard.', 'success');
              setTimeout(() => {
                btn.textContent = 'Copy';
              }, 2000);
            })
            .catch(err => {
              console.error('Failed to copy text:', err);
              showToast('Could not copy code snippet.', 'error');
            });
        }
      });
    });
  }
  
  if (window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      console.log('Voices synchronized.');
    };
  }
});
