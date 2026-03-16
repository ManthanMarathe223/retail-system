// ─────────────────────────────────────────────
// db.js — Shared MySQL connection
// Import this in any route file: const db = require('../db');
// ─────────────────────────────────────────────
const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

console.log("MySQL Pool created for database:", process.env.DB_NAME);

db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err.message);
        process.exit(1);
    }
    console.log("MySQL Connected to database:", process.env.DB_NAME);
});

module.exports = db;
