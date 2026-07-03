require('dotenv').config();
const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { 
  initDatabase, 
  dbGet, 
  dbRun, 
  saveChatMessage, 
  getUserChatHistory, 
  getUserChatSessions,
  clearUserChatHistory,
  updateUserSubscription
} = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'shifra_ai_super_secret_local_dev_key_2026';

// AI Service Configuration
const openrouterApiKey = process.env.OPENROUTER_API_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;
let geminiModel = null;

if (openrouterApiKey) {
  console.log('OpenRouter API gateway configured successfully (Billing-free route).');
} else if (geminiApiKey) {
  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    geminiModel = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      systemInstruction: 'You are Shifra AI, a premium and friendly AI coding partner. Help the user write, explain, review, and debug code. Use markdown tags for styling, code blocks, bold headings, and lists. Keep responses accurate, clear, and structured.'
    });
    console.log('Gemini AI Generative Model loaded successfully.');
  } catch (err) {
    console.error('Failed to initialize Gemini AI client:', err.message);
  }
} else {
  console.warn('\n======================================================');
  console.warn('⚠️  WARNING: No AI API keys are configured in your .env!');
  console.warn('Please add OPENROUTER_API_KEY or GEMINI_API_KEY.');
  console.warn('======================================================\n');
}

// Middleware to parse incoming requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets from public/
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Authentication Middleware to verify JSON Web Tokens (JWT).
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expecting: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Access token required.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired session token.' });
    }
    req.user = user;
    next();
  });
}

// ==========================================
// Authentication API Endpoints
// ==========================================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();

    // Username validation: 3-20 characters, alphanumeric and underscores only
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(trimmedUsername)) {
      return res.status(400).json({
        error: 'Username must be 3-20 characters, containing only letters, numbers, or underscores.'
      });
    }

    // Email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Password must include uppercase, lowercase, and numeric characters.' });
    }

    // Check if username or email is already taken
    const userExists = await dbGet(
      'SELECT username, email FROM users WHERE username = $1 OR email = $2',
      [trimmedUsername, trimmedEmail]
    );

    if (userExists) {
      if (userExists.username.toLowerCase() === trimmedUsername.toLowerCase()) {
        return res.status(409).json({ error: 'Username is already taken.' });
      }
      if (userExists.email.toLowerCase() === trimmedEmail) {
        return res.status(409).json({ error: 'Email address is already registered.' });
      }
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Save user to the PostgreSQL database (defaults to 'free' plan)
    const result = await dbRun(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [trimmedUsername, trimmedEmail, passwordHash]
    );
    const lastId = result.rows[0].id;

    const token = jwt.sign(
      { id: lastId, username: trimmedUsername },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'Account created successfully!',
      token,
      username: trimmedUsername,
      plan_tier: 'free'
    });
  } catch (error) {
    console.error('Registration API Error:', error);
    return res.status(500).json({ error: 'Internal server error occurred.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Credentials and password are required.' });
    }

    const identifier = username.trim().toLowerCase();

    const user = await dbGet(
      'SELECT * FROM users WHERE LOWER(username) = $1 OR LOWER(email) = $1',
      [identifier]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials or password.' });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: 'Invalid credentials or password.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Welcome back!',
      token,
      username: user.username,
      plan_tier: user.plan_tier || 'free'
    });
  } catch (error) {
    console.error('Login API Error:', error);
    return res.status(500).json({ error: 'Internal server error occurred.' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet(
      'SELECT id, username, email, plan_tier, plan_duration, plan_expiry FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.json({ valid: true, user });
  } catch (err) {
    console.error('Fetch me profile error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ==========================================
// Billing & Payment API Endpoints (Phase 3)
// ==========================================

/**
 * Endpoint: POST /api/billing/subscribe
 * Processes client purchase transaction and updates active subscription plan.
 */
app.post('/api/billing/subscribe', authenticateToken, async (req, res) => {
  try {
    const { planTier, planDuration } = req.body;
    const userId = req.user.id;

    if (!planTier || !planDuration) {
      return res.status(400).json({ error: 'Subscription tier and duration are required.' });
    }

    const cleanTier = planTier.trim().toLowerCase();
    const cleanDuration = planDuration.trim().toLowerCase();

    // Verify valid parameters
    if (!['pro', 'premium'].includes(cleanTier)) {
      return res.status(400).json({ error: 'Invalid subscription tier selected.' });
    }
    if (!['monthly', 'yearly'].includes(cleanDuration)) {
      return res.status(400).json({ error: 'Invalid plan duration selected.' });
    }

    // Update user row inside database
    const subscription = await updateUserSubscription(userId, cleanTier, cleanDuration);

    return res.json({
      message: 'Plan upgraded successfully!',
      plan_tier: subscription.plan_tier,
      plan_duration: subscription.plan_duration,
      plan_expiry: subscription.plan_expiry
    });
  } catch (error) {
    console.error('Subscription update endpoint error:', error);
    return res.status(500).json({ error: 'Failed to update subscription. Please try again.' });
  }
});

// ==========================================
// Chat & AI API Endpoints (Phase 2)
// ==========================================

/**
 * Endpoint: GET /api/chat/sessions
 * Returns all unique chat session headers (with titles and timestamps) for a user.
 */
app.get('/api/chat/sessions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const sessions = await getUserChatSessions(userId);
    return res.json({ sessions });
  } catch (error) {
    console.error('Fetch sessions error:', error);
    return res.status(500).json({ error: 'Could not retrieve conversation list.' });
  }
});

/**
 * Endpoint: GET /api/chat/history/:sessionId
 * Fetches the logs of a specific conversation session.
 */
app.get('/api/chat/history/:sessionId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;
    const history = await getUserChatHistory(userId, sessionId);
    return res.json({ history });
  } catch (error) {
    console.error('Fetch history error:', error);
    return res.status(500).json({ error: 'Could not retrieve session logs.' });
  }
});

/**
 * Endpoint: POST /api/chat
 * Route prompts to AI model securely, supporting OpenRouter or direct Gemini connections.
 */
app.post('/api/chat', authenticateToken, async (req, res) => {
  try {
    const { prompt, sessionId } = req.body;
    const userId = req.user.id;
    const activeSessionId = sessionId || 'default';

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt content is required.' });
    }

    // Check if at least one AI gateway is active
    if (!openrouterApiKey && !geminiModel) {
      return res.status(503).json({ 
        error: 'AI assistant is offline. Please configure OPENROUTER_API_KEY or GEMINI_API_KEY in your server .env file.' 
      });
    }

    // 1. Save user's message to DB
    await saveChatMessage(userId, 'user', prompt, activeSessionId);

    let responseText = '';

    if (openrouterApiKey) {
      // Fetch past conversation history for this specific session
      const pastMessages = await getUserChatHistory(userId, activeSessionId);

      // Structure messages list in standard ChatCompletion format
      const messages = pastMessages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.message
      }));

      // Prepend system prompt
      messages.unshift({
        role: 'system',
        content: 'You are Shifra AI, a premium and friendly AI coding partner. Help the user write, explain, review, and debug code. Use markdown tags for styling, code blocks, bold headings, and lists. Keep responses accurate, clear, and structured.'
      });

      // Query OpenRouter API using standard free models router
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openrouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Shifra AI'
        },
        body: JSON.stringify({
          model: 'openrouter/free',
          messages: messages
        })
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        console.error('OpenRouter Error Response Payload:', JSON.stringify(data, null, 2));
        const errorMsg = data.error?.message || 'OpenRouter server responded with an error.';
        throw new Error(errorMsg);
      }

      responseText = data.choices[0].message.content;
    } else {
      // Direct Gemini SDK fallback route
      const pastMessages = await getUserChatHistory(userId, activeSessionId);
      const chatHistory = pastMessages.slice(0, -1).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.message }]
      }));

      const chat = geminiModel.startChat({
        history: chatHistory
      });

      const response = await chat.sendMessage(prompt);
      responseText = response.response.text();
    }

    // 2. Save assistant's reply to DB
    await saveChatMessage(userId, 'assistant', responseText, activeSessionId);

    // 3. Return response text
    return res.json({ response: responseText });
  } catch (error) {
    console.error('AI API / Database error:', error);
    return res.status(500).json({ error: error.message || 'An error occurred while generating the assistant response.' });
  }
});

/**
 * Endpoint: DELETE /api/chat/history/:sessionId
 * Clears the database history logs for a specific user session.
 */
app.delete('/api/chat/history/:sessionId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;
    await clearUserChatHistory(userId, sessionId);
    return res.json({ message: 'Session history cleared.' });
  } catch (error) {
    console.error('Clear history error:', error);
    return res.status(500).json({ error: 'Could not clear chat logs.' });
  }
});

// ==========================================
// Server Initialization
// ==========================================
async function startServer() {
  try {
    await initDatabase();

    app.listen(PORT, () => {
      console.log(`+---------------------------------------------+`);
      console.log(`| SHIFRA AI SERVER STARTED SUCCESSFULLY       |`);
      console.log(`+---------------------------------------------+`);
      console.log(`| Port: ${PORT}                                  |`);
      console.log(`| Local URL: http://localhost:${PORT}             |`);
      console.log(`+---------------------------------------------+`);
    });
  } catch (dbError) {
    console.error('Could not initialize PostgreSQL database. Server will start, but APIs may fail until DB is connected.');
    app.listen(PORT, () => {
      console.log(`[WARN] Server started in DB-disconnected mode on port ${PORT}.`);
    });
  }
}

startServer();

module.exports = app;
