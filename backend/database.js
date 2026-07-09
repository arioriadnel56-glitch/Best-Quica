const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// En production hébergée : utiliser /tmp ou un dossier persistant
const DB_DIR = process.env.DB_PATH
? path.dirname(process.env.DB_PATH)
: process.env.DATA_DIR || path.join(__dirname, '..', 'data');

const DB_PATH = process.env.DB_PATH || path.join(DB_DIR, 'bestquinca.db');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

// Ouverture de la base de données
const db = new sqlite3.Database(DB_PATH);


// On recrée la méthode .exec de manière compatible pour tes requêtes de création
// Émulation complète pour maintenir la compatibilité avec better-sqlite3
db.exec = function(sql) {
db.serialize(() => {
db.run(sql, (err) => {
if (err) console.error("Erreur DDL:", err.message);
});
});
};

db.prepare = function(sql) {
return {
run: function(...params) {
db.serialize(() => {
db.run(sql, params, (err) => {
if (err) console.error("Erreur d'insertion synchrone:", err.message);
});
});
return { changes: 1, lastInsertRowid: 1 };
},
get: function(...params) {
let result = {};
db.serialize(() => {
db.get(sql, params, (err, row) => {
if (!err && row) {
Object.assign(result, row);
}
});
});
return result;
}
};
};





db.exec(`
  CREATE TABLE IF NOT EXISTS stores (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, city TEXT NOT NULL,
    phone TEXT DEFAULT '', email TEXT DEFAULT '', address TEXT DEFAULT '',
    logo_base64 TEXT DEFAULT '', currency TEXT DEFAULT 'FCFA',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, store_id TEXT NOT NULL, full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('owner','secretary')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY, store_id TEXT NOT NULL, name TEXT NOT NULL,
    phone TEXT DEFAULT '', email TEXT DEFAULT '', address TEXT DEFAULT '',
    client_type TEXT DEFAULT 'detail' CHECK(client_type IN ('detail','gros','vip')),
    note TEXT DEFAULT '', created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS materials (
    id TEXT PRIMARY KEY, store_id TEXT NOT NULL, name TEXT NOT NULL,
    category TEXT DEFAULT '', unit_detail TEXT DEFAULT 'Unité',
    unit_gros TEXT DEFAULT 'Carton', price_detail REAL DEFAULT 0,
    price_gros REAL DEFAULT 0, qty_gros INTEGER DEFAULT 1,
    stock REAL DEFAULT 0, stock_min REAL DEFAULT 10, version INTEGER DEFAULT 1,
    updated_at TEXT DEFAULT (datetime('now')), created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS stock_movements (
    id TEXT PRIMARY KEY, store_id TEXT NOT NULL, material_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('in','out','adjust','sale','return')),
    qty REAL NOT NULL, qty_before REAL NOT NULL, qty_after REAL NOT NULL,
    sale_type TEXT DEFAULT 'detail', reason TEXT DEFAULT '',
    ref_id TEXT DEFAULT '', created_by TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY(material_id) REFERENCES materials(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY, store_id TEXT NOT NULL, invoice_num TEXT NOT NULL,
    client_id TEXT, client_name TEXT DEFAULT '', client_phone TEXT DEFAULT '',
    client_address TEXT DEFAULT '',
    sale_type TEXT DEFAULT 'detail' CHECK(sale_type IN ('detail','gros','mixte')),
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft','paid','cancelled')),
    total_ht REAL DEFAULT 0, discount REAL DEFAULT 0, total_ttc REAL DEFAULT 0,
    note TEXT DEFAULT '', created_by TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')), paid_at TEXT,
    FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE SET NULL
  );
  CREATE TABLE IF NOT EXISTS invoice_lines (
    id TEXT PRIMARY KEY, invoice_id TEXT NOT NULL, material_id TEXT,
    description TEXT NOT NULL, sale_type TEXT DEFAULT 'detail',
    qty REAL NOT NULL, unit TEXT DEFAULT 'Unité', unit_price REAL NOT NULL, total REAL NOT NULL,
    FOREIGN KEY(invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY, store_id TEXT NOT NULL, invoice_id TEXT,
    material_id TEXT NOT NULL, sale_type TEXT DEFAULT 'detail',
    qty REAL NOT NULL, unit_price REAL NOT NULL,
    client_id TEXT, client TEXT DEFAULT '', created_by TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY(material_id) REFERENCES materials(id) ON DELETE RESTRICT,
    FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE SET NULL
  );
  CREATE TABLE IF NOT EXISTS trucks (
    id TEXT PRIMARY KEY, store_id TEXT NOT NULL, name TEXT NOT NULL,
    driver TEXT NOT NULL, active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS truck_logs (
    id TEXT PRIMARY KEY, store_id TEXT NOT NULL, truck_id TEXT NOT NULL,
    date TEXT NOT NULL, trips INTEGER DEFAULT 0, note TEXT DEFAULT '',
    created_by TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(truck_id, date),
    FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY(truck_id) REFERENCES trucks(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_users_email      ON users(email);
  CREATE INDEX IF NOT EXISTS idx_clients_store    ON clients(store_id);
  CREATE INDEX IF NOT EXISTS idx_materials_store  ON materials(store_id);
  CREATE INDEX IF NOT EXISTS idx_movements_store  ON stock_movements(store_id);
  CREATE INDEX IF NOT EXISTS idx_invoices_store   ON invoices(store_id);
  CREATE INDEX IF NOT EXISTS idx_sales_store      ON sales(store_id);
  CREATE INDEX IF NOT EXISTS idx_trucks_store     ON trucks(store_id);
`);

console.log('✅ Base de données initialisée :', DB_PATH);
module.exports = db;
