const mysql = require('mysql2/promise');
require('dotenv').config();

let pool = null;

function normalizeRows(rows) {
  if (!Array.isArray(rows)) return rows;
  return rows.map(row => {
    if (!row || typeof row !== 'object' || row instanceof Date) return row;
    const upperRow = {};
    for (const [key, value] of Object.entries(row)) {
      upperRow[key.toUpperCase()] = value;
    }
    return upperRow;
  });
}

function getPoolConfig() {
  const host = process.env.DB_HOST || 'localhost';
  const isAiven = host.includes('aivencloud.com') || process.env.DB_SSL === 'true';

  const config = {
    host: host,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'medicore',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: 'Z',
    dateStrings: true,
    // Prevent ECONNRESET from cloud DB dropping idle connections
    connectTimeout: 30000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    idleTimeout: 60000
  };

  // Support Aiven and Cloud MySQL SSL requirements
  if (isAiven || process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false') {
    config.ssl = {
      rejectUnauthorized: false
    };
  }

  return config;
}

async function initialize() {
  try {
    const config = getPoolConfig();
    pool = mysql.createPool(config);

    // Verify connection by pinging
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();

    console.log(`MySQL Database Connection Pool initialized on ${config.host}:${config.port}/${config.database}`);
    return true;
  } catch (err) {
    console.error('FATAL: Could not initialize MySQL pool:', err.message);
    return false;
  }
}

/**
 * Execute a single query against the pool
 */
async function executeQuery(sql, params = []) {
  if (!pool) {
    const initialized = await initialize();
    if (!initialized) {
      throw new Error('Database pool is not initialized');
    }
  }

  const tryQuery = async () => {
    const [result] = await pool.query(sql, params);
    if (Array.isArray(result)) {
      return {
        rows: normalizeRows(result),
        rowsAffected: result.length,
        insertId: 0
      };
    }
    return {
      rows: [],
      rowsAffected: result.affectedRows || 0,
      insertId: result.insertId || 0
    };
  };

  try {
    return await tryQuery();
  } catch (err) {
    // If connection was reset (cloud DB dropped idle conn), recreate pool and retry once
    if (err.code === 'ECONNRESET' || err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ENOTFOUND') {
      console.warn('[DB] Connection reset detected — recreating pool and retrying...');
      pool = null;
      const reinitialized = await initialize();
      if (!reinitialized) throw new Error('Database reconnection failed');
      try {
        return await tryQuery();
      } catch (retryErr) {
        console.error('Error executing MySQL query (after retry):', retryErr.message, '\nSQL:', sql, '\nParams:', params);
        throw retryErr;
      }
    }
    console.error('Error executing MySQL query:', err.message, '\nSQL:', sql, '\nParams:', params);
    throw err;
  }
}

/**
 * Get a connection for multi-statement atomic transactions
 */
async function getConnection() {
  if (!pool) {
    const initialized = await initialize();
    if (!initialized) {
      throw new Error('Database pool is not initialized');
    }
  }

  const tryGetConn = async () => {
    const rawConn = await pool.getConnection();
    // Ping the connection to confirm it is alive
    try {
      await rawConn.ping();
    } catch (pingErr) {
      rawConn.destroy();
      throw pingErr;
    }
    return rawConn;
  };

  let rawConn;
  try {
    rawConn = await tryGetConn();
  } catch (err) {
    if (err.code === 'ECONNRESET' || err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ENOTFOUND') {
      console.warn('[DB] Connection reset on getConnection — recreating pool and retrying...');
      pool = null;
      const reinitialized = await initialize();
      if (!reinitialized) throw new Error('Database reconnection failed');
      rawConn = await tryGetConn();
    } else {
      throw err;
    }
  }

  return {
    execute: async (sql, params = []) => {
      const [result] = await rawConn.query(sql, params);
      if (Array.isArray(result)) {
        return {
          rows: normalizeRows(result),
          rowsAffected: result.length,
          insertId: 0
        };
      }
      return {
        rows: [],
        rowsAffected: result.affectedRows || 0,
        insertId: result.insertId || 0
      };
    },
    beginTransaction: async () => await rawConn.beginTransaction(),
    commit: async () => await rawConn.commit(),
    rollback: async () => await rawConn.rollback(),
    release: () => rawConn.release(),
    close: () => rawConn.release() // Compatibility alias with previous Oracle code
  };
}

module.exports = {
  initialize,
  executeQuery,
  getConnection
};
