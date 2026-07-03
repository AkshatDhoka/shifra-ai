require('dotenv').config();
const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { GoogleGenAI } = require('@google/generative-ai');
const { 
  initDatabase, 
  dbGet, 
  dbRun, 
  saveChatMessage, 
  getUserChatHistory, 
  clearUserChatHistory 
} = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'shifra_ai_super_secret_local_dev_key_2026';

// Initialize Gemini API
const geminiApiKey = process.env.GEMINI_API_KEY;
let geminiModel = null;

if (!geminiApiKey) {
  console.warn('\n======================================================');
  console.warn('⚠️  WARNING: GEMINI_API_KEY is not set in your .env file!');
  console.warn('AI chat features will return a configuration warning.');
  console.warn('Please grab a free key from Google AI Studio.');
  console.warn('======================================================\n');
} else {
  try {
    // Initialize Google Gen AI client
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    // Use gemini-1.5-flash for fast and cost-effective responses
    geminiModel = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log('Gemini AI Generative Model loaded successfully.');
  } catch (err) {
    console.error('Failed to initialize Gemini AI client:', err.message);
  }
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

    // Save user to the PostgreSQL database
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
      username: trimmedUsername
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
      username: user.username
    });
  } catch (error) {
    console.error('Login API Error:', error);
    return res.status(500).json({ error: 'Internal server error occurred.' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  return res.json({ valid: true, user: req.user });
});

// ==========================================
// Chat & AI API Endpoints (Phase 2)
// ==========================================

/**
 * Endpoint: POST /api/chat
 * Route prompts to Gemini model securely, integrating multi-turn history.
 */
app.post('/api/chat', authenticateToken, async (req, res) => {
  try {
    const { prompt } = req.body;
    const userId = req.user.id;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt content is required.' });
    }

    // Check if Gemini API is configured
    if (!geminiModel) {
      return res.status(503).json({ 
        error: 'AI assistant is offline. Please configure GEMINI_API_KEY in your server .env file.' 
      });
    }

    // 1. Save user's message to DB
    await saveChatMessage(userId, 'user', prompt);

    // 2. Fetch past conversation history for this user to build context
    const pastMessages = await getUserChatHistory(userId);

    // 3. Map history format to match Google Gen AI SDK requirements (roles: 'user' / 'model')
    // Exclude the very last user message because we'll send it as the prompt
    const chatHistory = pastMessages.slice(0, -1).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.message }]
    }));

    // 4. Start a multi-turn conversation session using Gemini SDK
    const chat = geminiModel.startChat({
      history: chatHistory,
      systemInstruction: 'You are Shifra AI, a premium and friendly AI coding partner. Help the user write, explain, review, and debug code. Use markdown tags for styling, code blocks, bold headings, and lists. Keep responses accurate, clear, and structured.'
    });

    // 5. Query the model
    const response = await chat.sendMessage(prompt);
    const responseText = response.response.text();

    // 6. Save assistant's reply to DB
    await saveChatMessage(userId, 'assistant', responseText);

    // 7. Return payload
    return res.json({ response: responseText });
  } catch (error) {
    console.error('Gemini AI API / Database error:', error);
    return res.status(500).json({ error: 'An error occurred while generating the assistant response.' });
  }
});

/**
 * Endpoint: GET /api/chat/history
 * Fetches the user's secure saved chat logs.
 */
app.get('/api/chat/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await getUserChatHistory(userId);
    return res.json({ history });
  } catch (error) {
    console.error('Fetch history error:', error);
    return res.status(500).json({ error: 'Could not retrieve chat logs.' });
  }
});

/**
 * Endpoint: DELETE /api/chat/history
 * Clears the database history logs for the active user.
 */
app.delete('/api/chat/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    await clearUserChatHistory(userId);
    return res.json({ message: 'Conversation history cleared.' });
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
