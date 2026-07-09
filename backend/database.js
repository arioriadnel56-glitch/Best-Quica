const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const DB_PATH = process.env.DB_PATH || path.join(DB_DIR, 'bestquinca.db');

if (!fs.existsSync(DB_DIR)) {
fs.mkdirSync(DB_DIR, { recursive: true });
}

// L'ouverture se fait de manière synchrone et native
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Création initiale et propre des tables indispensables
db.exec(`
CREATE TABLE IF NOT EXISTS stores (
id TEXT PRIMARY KEY,
name TEXT NOT NULL,
city TEXT NOT NULL,
phone TEXT DEFAULT '',
email TEXT DEFAULT '',
address TEXT DEFAULT '',
logo_base64 TEXT DEFAULT '',
currency TEXT DEFAULT 'FCFA',
created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
id TEXT PRIMARY KEY,
store_id TEXT NOT NULL,
full_name TEXT NOT NULL,
email TEXT NOT NULL UNIQUE,
password_hash TEXT NOT NULL,
role TEXT NOT NULL CHECK(role IN ('owner', 'secretary')),
created_at TEXT DEFAULT (datetime('now')),
FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE
);
`);

module.exports = db;


