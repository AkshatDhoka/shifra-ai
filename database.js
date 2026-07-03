require('dotenv').config();
const { Pool } = require('pg');

// Create PostgreSQL connection pool
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
  database: process.env.PGDATABASE || 'shifra_ai',
  port: parseInt(process.env.PGPORT || '5432', 10),
  ssl: process.env.PGHOST && process.env.PGHOST !== 'localhost' ? { rejectUnauthorized: false } : false
});

/**
 * Execute a generic SQL query.
 * @param {string} text - The SQL query text with $1, $2 placeholders
 * @param {Array} params - Query arguments
 * @returns {Promise<import('pg').QueryResult>}
 */
async function dbQuery(text, params = []) {
  return await pool.query(text, params);
}

/**
 * Fetch a single row.
 * @param {string} text - SQL query
 * @param {Array} params - Query arguments
 * @returns {Promise<Object|undefined>}
 */
async function dbGet(text, params = []) {
  const res = await dbQuery(text, params);
  return res.rows[0];
}

/**
 * Fetch all matching rows.
 * @param {string} text - SQL query
 * @param {Array} params - Query arguments
 * @returns {Promise<Array<Object>>}
 */
async function dbAll(text, params = []) {
  const res = await dbQuery(text, params);
  return res.rows;
}

/**
 * Perform data modification queries (INSERT, UPDATE, DELETE).
 * @param {string} text - SQL query
 * @param {Array} params - Query arguments
 * @returns {Promise<{rowCount: number, rows: Array<any>}>}
 */
async function dbRun(text, params = []) {
  const res = await dbQuery(text, params);
  return {
    rowCount: res.rowCount,
    rows: res.rows
  };
}

/**
 * Saves a single chat message linked to a specific user and session.
 * @param {number} userId - ID of the sender user
 * @param {string} role - 'user' or 'assistant'
 * @param {string} message - Content of the message
 * @param {string} sessionId - ID of the conversation session
 * @returns {Promise<Object>} The saved message record containing id and timestamp
 */
async function saveChatMessage(userId, role, message, sessionId = 'default') {
  const result = await dbRun(
    'INSERT INTO chats (user_id, role, message, session_id) VALUES ($1, $2, $3, $4) RETURNING id, timestamp',
    [userId, role, message, sessionId]
  );
  return result.rows[0];
}

/**
 * Fetches all chronological chat messages for a user session.
 * @param {number} userId - ID of the user
 * @param {string} sessionId - ID of the session
 * @returns {Promise<Array<Object>>} Messages list
 */
async function getUserChatHistory(userId, sessionId = 'default') {
  return await dbAll(
    'SELECT role, message, timestamp FROM chats WHERE user_id = $1 AND session_id = $2 ORDER BY timestamp ASC',
    [userId, sessionId]
  );
}

/**
 * Fetches all unique chat sessions (headers) for a user.
 * Uses the first user message in each session as the title.
 * @param {number} userId - ID of the user
 * @returns {Promise<Array<Object>>} Unique sessions details
 */
async function getUserChatSessions(userId) {
  return await dbAll(`
    SELECT DISTINCT ON (session_id) session_id, message, timestamp
    FROM chats
    WHERE user_id = $1 AND role = 'user'
    ORDER BY session_id, timestamp ASC
  `, [userId]);
}

/**
 * Deletes all chat history rows for a specific user session.
 * @param {number} userId - ID of the user
 * @param {string} sessionId - ID of the session to clear
 * @returns {Promise<{rowCount: number}>} Delete result details
 */
async function clearUserChatHistory(userId, sessionId = 'default') {
  return await dbRun(
    'DELETE FROM chats WHERE user_id = $1 AND session_id = $2',
    [userId, sessionId]
  );
}

/**
 * Updates a user's subscription active parameters.
 * @param {number} userId - ID of the user
 * @param {string} tier - 'free', 'pro', or 'premium'
 * @param {string} duration - 'none', 'monthly', or 'yearly'
 * @returns {Promise<Object>} The updated subscription details
 */
async function updateUserSubscription(userId, tier, duration) {
  const expiryDays = duration === 'yearly' ? 365 : 30;
  const result = await dbRun(
    `UPDATE users 
     SET plan_tier = $1, plan_duration = $2, plan_expiry = NOW() + ($3 || ' DAY')::INTERVAL
     WHERE id = $4
     RETURNING plan_tier, plan_duration, plan_expiry`,
    [tier, duration, expiryDays.toString(), userId]
  );
  return result.rows[0];
}

/**
 * Initializes tables in PostgreSQL.
 */
async function initDatabase() {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL.');
    client.release();

    // 1. Create Users Table (Added plan settings support)
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        plan_tier VARCHAR(20) DEFAULT 'free',
        plan_duration VARCHAR(20) DEFAULT 'none',
        plan_expiry TIMESTAMP DEFAULT NULL
      )
    `);

    // 2. Create Chats Table
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS chats (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) CHECK (role IN ('user', 'assistant')) NOT NULL,
        message TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure session_id column exists
    await dbQuery(`
      ALTER TABLE chats ADD COLUMN IF NOT EXISTS session_id VARCHAR(50) DEFAULT 'default'
    `);

    // Ensure new subscription columns exist on older user tables if they already exist
    await dbQuery(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_tier VARCHAR(20) DEFAULT 'free'
    `);
    await dbQuery(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_duration VARCHAR(20) DEFAULT 'none'
    `);
    await dbQuery(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expiry TIMESTAMP DEFAULT NULL
    `);

    console.log('PostgreSQL tables verified/initialized.');
  } catch (error) {
    console.error('PostgreSQL Connection error:', error.message);
    throw error;
  }
}

module.exports = {
  pool,
  dbQuery,
  dbGet,
  dbAll,
  dbRun,
  saveChatMessage,
  getUserChatHistory,
  getUserChatSessions,
  clearUserChatHistory,
  updateUserSubscription,
  initDatabase
};
