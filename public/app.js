/**
 * SHIFRA AI - CLIENT CONTROLLER (PHASES 1 & 2)
 * Handles transitions, 3D flip card, real-time validations, email checks,
 * welcome overlay transition animations, markdown formatting, speech recognition,
 * speech synthesis, and secure REST communication with the backend.
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
  const chatFeed = document.getElementById('chat-feed');
  const chatPrompt = document.getElementById('chat-prompt');
  const btnSendMessage = document.getElementById('btn-send-message');
  const btnClearHistory = document.getElementById('btn-clear-history');
  
  // Voice Controls
  const voiceBubble = document.getElementById('voice-bubble');
  const btnMicDictate = document.getElementById('btn-mic-dictate');
  const speechStatusBar = document.getElementById('speech-status-bar');
  const speechStatusText = document.getElementById('speech-status-text');

  // --- Voice / Speech Variables ---
  let isListeningMode = false; // Controls the hands-free floating bubble
  let isDictating = false;     // Controls the inline prompt dictation
  let recognition = null;      // Web Speech API Recognition instance
  let activeSpeechUtterance = null; // Currently speaking utterance

  // Initialize Speech Recognition if supported
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
  }

  // --- Session Loader ---
  // Checks token and transitions user to the appropriate screen
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
    // Stop speaking if active
    stopSpeaking();
    
    // Clear credentials
    localStorage.removeItem('shifra_token');
    localStorage.removeItem('shifra_user');
    
    // Reset workspace DOM state
    chatFeed.innerHTML = '';
    
    // Fade out and return to landing
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
    
    // Focus prompt automatically
    chatPrompt.focus();

    // 1. Fetch saved messages from PostgreSQL
    await fetchChatHistory();
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

    // Stop speaking if active before starting a new chat
    stopSpeaking();

    // 1. Render User message in feed
    appendMessageToFeed('user', promptText);
    
    // Clear input box
    chatPrompt.value = '';
    chatPrompt.style.height = 'auto';

    // Remove suggestions cards template wrapper if present
    const welcomeWrapper = document.getElementById('chat-welcome-cards');
    if (welcomeWrapper) {
      welcomeWrapper.remove();
    }

    // 2. Render typing loader indicator
    const loaderId = appendTypingIndicator();
    scrollToBottom();

    // 3. Dispatch POST API call to server
    try {
      const activeToken = localStorage.getItem('shifra_token');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeToken}`
        },
        body: JSON.stringify({ prompt: promptText })
      });

      const data = await response.json();
      
      // Remove typing dots
      removeTypingIndicator(loaderId);

      if (!response.ok) {
        appendMessageToFeed('assistant', `⚠️ **Error**: ${data.error || 'Could not fetch reply.'}`);
        showToast(data.error || 'Server error, check connections.', 'error');
      } else {
        // Render assistant markdown response
        appendMessageToFeed('assistant', data.response);
        
        // If Voice mode is active, read the text reply aloud
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
      // Parse markdown to HTML for Gemini responses
      bubble.innerHTML = parseMarkdownToHtml(text);
      
      // Bind copy listeners to any copy-code buttons
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

  // --- Fetch past history logs from server ---
  async function fetchChatHistory() {
    try {
      const activeToken = localStorage.getItem('shifra_token');
      const response = await fetch('/api/chat/history', {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      const data = await response.json();

      if (response.ok && data.history && data.history.length > 0) {
        // Clear empty state prompt wrapper
        const welcomeWrapper = document.getElementById('chat-welcome-cards');
        if (welcomeWrapper) welcomeWrapper.remove();

        // Render each past message
        data.history.forEach(msg => {
          appendMessageToFeed(msg.role, msg.message);
        });
        scrollToBottom();
      }
    } catch (err) {
      console.error('Failed to load history:', err);
      showToast('Could not load chat logs from database.', 'error');
    }
  }

  // --- Clear History Click Handler ---
  btnClearHistory.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to clear your entire chat history? This cannot be undone.')) {
      return;
    }

    try {
      const activeToken = localStorage.getItem('shifra_token');
      const response = await fetch('/api/chat/history', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });

      if (response.ok) {
        stopSpeaking();
        chatFeed.innerHTML = '';
        showToast('Chat history cleared.', 'success');
        
        // Re-render empty welcome cards
        renderWelcomeCards();
      } else {
        showToast('Could not clear chat history.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Clear history query failed.', 'error');
    }
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
  // VOICE CONTROL ENGINE (SpeechRecognition & SpeechSynthesis)
  // ==========================================

  // --- Voice Bubble Widget click handler ---
  // Clicking the floating bubble toggles hands-free talk companion mode
  voiceBubble.addEventListener('click', () => {
    if (!recognition) {
      showToast('Speech recognition not supported in this browser. Please use Chrome.', 'warning');
      return;
    }

    if (isListeningMode) {
      // Deactivate
      deactivateVoiceCompanion();
    } else {
      // Activate
      activateVoiceCompanion();
    }
  });

  // --- Dictation Button Click handler ---
  // Dictates voice directly into text box without auto-sending
  btnMicDictate.addEventListener('click', () => {
    if (!recognition) {
      showToast('Speech recognition not supported in this browser.', 'warning');
      return;
    }

    // Stop hands-free voice companion if active
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
    
    // Stop any active TTS audio speaking
    stopSpeaking();
    
    startSpeechRecognition();
  }

  function deactivateVoiceCompanion() {
    isListeningMode = false;
    voiceBubble.className = 'voice-bubble-widget'; // resets state classes
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
      // Recognition might already be running, catch and ignore
    }
  }

  // --- Web Speech API Recognition Bindings ---
  if (recognition) {
    recognition.onstart = () => {
      console.log('Voice engine active.');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log('Speech captured:', transcript);

      if (isListeningMode) {
        // Hands-free mode: place transcript in prompt and submit it directly!
        chatPrompt.value = transcript;
        adjustTextareaHeight();
        speechStatusText.textContent = 'Speech Captured. Decoding...';
        handleSendMessageSubmit();
      } else if (isDictating) {
        // Dictation mode: append text to current input area
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
        // If hands-free and silent, restart listening to keep loop active
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
      // If hands-free is active and not currently speaking answers, restart loop
      if (isListeningMode && !voiceBubble.classList.contains('speaking')) {
        startSpeechRecognition();
      }
      
      // Reset dictate state
      if (isDictating) {
        isDictating = false;
        btnMicDictate.classList.remove('recording-active');
      }
    };
  }

  // --- Text to Speech (SpeechSynthesis) Helpers ---
  function speakText(rawText) {
    if (!window.speechSynthesis) return;

    // Filter out code snippets, markdown characters, and URLs for clearer pronunciation
    const speakableText = cleanTextForSpeech(rawText);

    // Stop previous audio
    stopSpeaking();

    activeSpeechUtterance = new SpeechSynthesisUtterance(speakableText);
    
    // Choose active english voice if available
    const voices = window.speechSynthesis.getVoices();
    const defaultVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || voices.find(v => v.lang.startsWith('en'));
    if (defaultVoice) {
      activeSpeechUtterance.voice = defaultVoice;
    }

    // Bind synthesis states to voice bubble equalizer animation triggers
    activeSpeechUtterance.onstart = () => {
      // Pause recognition loop while speaking to avoid echo loopback!
      if (recognition && isListeningMode) {
        recognition.stop();
      }
      voiceBubble.classList.add('speaking');
      speechStatusText.textContent = 'Voice Companion: Speaking...';
    };

    activeSpeechUtterance.onend = () => {
      voiceBubble.classList.remove('speaking');
      activeSpeechUtterance = null;

      // Re-enable speech recognition loop if hands-free is still active
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

  /**
   * Strips markdown tags and filters code snippets to make text read naturally.
   */
  function cleanTextForSpeech(text) {
    // 1. Remove entire code blocks
    let cleaned = text.replace(/```[\s\S]*?```/g, '[Code snippet omitted]');
    
    // 2. Remove inline code highlights, bold markers, asterisks, headers, etc.
    cleaned = cleaned.replace(/`([^`]+)`/g, '$1')
                     .replace(/\*\*([^*]+)\*\*/g, '$1')
                     .replace(/\*([^*]+)\*/g, '$1')
                     .replace(/#+\s+/g, '')
                     .replace(/[-*]\s+/g, '')
                     .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // links
                     
    return cleaned.trim();
  }


  // ==========================================
  // CUSTOM MARKDOWN ENGINE (HTML PARSER)
  // ==========================================

  /**
   * Translates Markdown tags (headers, lists, bold text, code blocks) to semantic HTML.
   * Includes copy-to-clipboard code blocks headers creation.
   */
  function parseMarkdownToHtml(markdownText) {
    if (!markdownText) return '';

    let html = markdownText;

    // Escape raw HTML characters to prevent XSS injection inside content text
    html = html.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;');

    // 1. Parse code blocks: ```language \n code ```
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

    // 2. Parse inline code highlights: `code`
    html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');

    // 3. Parse headers: ### Title, ## Title, # Title
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>')
               .replace(/^## (.*?)$/gm, '<h3>$1</h3>')
               .replace(/^# (.*?)$/gm, '<h2>$1</h2>');

    // 4. Parse bold texts: **text**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // 5. Parse unordered lists: * item, - item
    // Match line breaks with bullet symbols and convert them
    html = html.replace(/^\s*[-*]\s+(.*?)$/gm, '<li>$1</li>');
    // Wrap consecutive list tags inside <ul> (a simple check replacing surrounding list items)
    html = html.replace(/(<li>.*?<\/li>)/s, '<ul>$1</ul>');

    // 6. Handle single carriage returns and paragraphs (skip code tags and list containers)
    // Replace double newlines with spacing paragraph tags
    html = html.replace(/\n\n/g, '<br><br>');

    return html;
  }

  /**
   * Adds click listeners to copy-code buttons inside assistant answers.
   */
  function bindCopyCodeButtons(bubbleElement) {
    const copyBtns = bubbleElement.querySelectorAll('.btn-copy-code');
    copyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // The code block <pre> is the next sibling element after the header
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
  
  // Ensure voices are fetched (Chrome voice async fetch helper)
  if (window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      console.log('Voices synchronized.');
    };
  }
});
