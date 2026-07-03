require('dotenv').config();
const { Pool } = require('pg');

// Create PostgreSQL connection pool
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '',
  database: process.env.PGDATABASE || 'shifra_ai',
  port: parseInt(process.env.PGPORT || '5432', 10),
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
 * Saves a single chat message linked to a specific user.
 * @param {number} userId - ID of the sender user
 * @param {string} role - 'user' or 'assistant'
 * @param {string} message - Content of the message
 * @returns {Promise<Object>} The saved message record containing id and timestamp
 */
async function saveChatMessage(userId, role, message) {
  const result = await dbRun(
    'INSERT INTO chats (user_id, role, message) VALUES ($1, $2, $3) RETURNING id, timestamp',
    [userId, role, message]
  );
  return result.rows[0];
}

/**
 * Fetches all chronological chat messages for a user.
 * @param {number} userId - ID of the user
 * @returns {Promise<Array<Object>>} Messages list
 */
async function getUserChatHistory(userId) {
  return await dbAll(
    'SELECT role, message, timestamp FROM chats WHERE user_id = $1 ORDER BY timestamp ASC',
    [userId]
  );
}

/**
 * Deletes all chat history rows for a user.
 * @param {number} userId - ID of the user
 * @returns {Promise<{rowCount: number}>} Delete result details
 */
async function clearUserChatHistory(userId) {
  return await dbRun(
    'DELETE FROM chats WHERE user_id = $1',
    [userId]
  );
}

/**
 * Initializes tables in PostgreSQL.
 * Drops existing tables to apply the new schema configuration with email.
 */
async function initDatabase() {
  try {
    // Attempt database connection
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL.');
    client.release();

    // 1. Create Users Table (Added email field)
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Create Chats Table (Ready for Phase 2)
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS chats (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) CHECK (role IN ('user', 'assistant')) NOT NULL,
        message TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('PostgreSQL tables verified/initialized.');
  } catch (error) {
    console.error('\n======================================================');
    console.error('❌ POSTGRESQL CONNECTION ERROR');
    console.error('======================================================');
    console.error('Details:', error.message);
    console.error('\nTROUBLESHOOTING STEPS:');
    console.error('1. Make sure your PostgreSQL server is running.');
    console.error('2. Create the target database if it doesn\'t exist. Connect to PostgreSQL and run:');
    console.error('   CREATE DATABASE shifra_ai;');
    console.error('3. Verify that your host, port, user, and password in .env are correct.');
    console.error('======================================================\n');
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
  clearUserChatHistory,
  initDatabase
};
