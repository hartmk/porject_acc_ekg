// db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '43.228.85.120',
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || 'jame',
  password: process.env.DB_PASS || 'accmed1234',
  database: process.env.DB_NAME || 'hos',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
