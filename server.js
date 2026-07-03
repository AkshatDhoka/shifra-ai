require('dotenv').config();
const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { initDatabase, dbGet, dbRun } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'shifra_ai_super_secret_local_dev_key_2026';

// Middleware to parse incoming requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets from public/
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Authentication Middleware to verify JSON Web Tokens (JWT).
 * Will be utilized in Phase 2 for saving/fetching chat histories.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Expecting: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Access token required.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
}

// ==========================================
// Authentication API Endpoints
// ==========================================

/**
 * Endpoint: POST /api/auth/register
 * Handles user account creation.
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check for empty inputs
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const trimmedUsername = username.trim();

    // Username validation: 3-20 characters, alphanumeric and underscores only
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(trimmedUsername)) {
      return res.status(400).json({
        error: 'Username must be 3-20 characters, containing only letters, numbers, or underscores.'
      });
    }

    // Password validation: 8+ characters, at least 1 uppercase, 1 lowercase, 1 digit
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one uppercase letter.' });
    }
    if (!/[a-z]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one lowercase letter.' });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one number.' });
    }

    // Check if user already exists
    const userExists = await dbGet('SELECT id FROM users WHERE username = ?', [trimmedUsername]);
    if (userExists) {
      return res.status(409).json({ error: 'Username is already taken.' });
    }

    // Hash the password securely
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Save user to the SQLite database
    const { lastId } = await dbRun(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [trimmedUsername, passwordHash]
    );

    // Auto-generate JWT for immediate login session
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

/**
 * Endpoint: POST /api/auth/login
 * Authenticates credentials and returns a JWT.
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const trimmedUsername = username.trim();

    // Query user profile
    const user = await dbGet('SELECT * FROM users WHERE username = ?', [trimmedUsername]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Compare input password with database hash
    const isPasswordMatch = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Generate JWT token
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

/**
 * Endpoint: GET /api/auth/me
 * Checks token validity and returns user details.
 */
app.get('/api/auth/me', authenticateToken, (req, res) => {
  return res.json({ valid: true, user: req.user });
});

// ==========================================
// Server Initialization
// ==========================================
async function startServer() {
  // Ensure database tables exist
  await initDatabase();

  app.listen(PORT, () => {
    console.log(`+---------------------------------------------+`);
    console.log(`| SHIFRA AI SERVER STARTED SUCCESSFULLY       |`);
    console.log(`+---------------------------------------------+`);
    console.log(`| Port: ${PORT}                                  |`);
    console.log(`| Local URL: http://localhost:${PORT}             |`);
    console.log(`+---------------------------------------------+`);
  });
}

startServer();
