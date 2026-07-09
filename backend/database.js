const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === 'production';

const connectionString = process.env.DATABASE_URL || 'postgresql://adnel:password123@localhost:5432/bestquinca_local';

const pool = new Pool({
connectionString: connectionString,
ssl: isProduction ? { rejectUnauthorized: false } : false
});

const initDB = async () => {
try {
// Étape intermédiaire : Tester la connexion avant d'envoyer les grosses requêtes
const clientTest = await pool.connect();
console.log(">>> Connexion physique au serveur PostgreSQL réussie.");
clientTest.release();

await pool.query(`
CREATE TABLE IF NOT EXISTS stores (
id TEXT PRIMARY KEY,
name TEXT NOT NULL,
city TEXT NOT NULL,
phone TEXT DEFAULT '',
email TEXT DEFAULT '',
address TEXT DEFAULT '',
logo_base64 TEXT DEFAULT '',
currency TEXT DEFAULT 'FCFA',
subscription_status TEXT DEFAULT 'trial',
subscription_expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '30 days',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
id TEXT PRIMARY KEY,
store_id TEXT NOT NULL,
full_name TEXT NOT NULL,
email TEXT NOT NULL UNIQUE,
password_hash TEXT NOT NULL,
role TEXT NOT NULL CHECK(role IN ('owner', 'secretary')),
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS materials (
id TEXT PRIMARY KEY,
store_id TEXT NOT NULL,
name TEXT NOT NULL,
category TEXT DEFAULT 'Général',
stock_quantity NUMERIC DEFAULT 0,
unit TEXT DEFAULT 'pièce',
purchase_price NUMERIC DEFAULT 0,
selling_price NUMERIC DEFAULT 0,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sales (
id TEXT PRIMARY KEY,
store_id TEXT NOT NULL,
user_id TEXT NOT NULL,
customer_name TEXT DEFAULT 'Client Comptant',
total_amount NUMERIC DEFAULT 0,
payment_method TEXT DEFAULT 'Espèces',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE,
FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS clients (
id TEXT PRIMARY KEY,
store_id TEXT NOT NULL,
name TEXT NOT NULL,
phone TEXT DEFAULT '',
debt NUMERIC DEFAULT 0,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS team (
id TEXT PRIMARY KEY,
store_id TEXT NOT NULL,
full_name TEXT NOT NULL,
phone TEXT DEFAULT '',
salary NUMERIC DEFAULT 0,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS trucks (
id TEXT PRIMARY KEY,
store_id TEXT NOT NULL,
license_plate TEXT NOT NULL,
model TEXT DEFAULT '',
status TEXT DEFAULT 'disponible',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS invoices (
id TEXT PRIMARY KEY,
store_id TEXT NOT NULL,
client_id TEXT,
invoice_number TEXT NOT NULL,
total_amount NUMERIC DEFAULT 0,
status TEXT DEFAULT 'impayé',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE,
FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE SET NULL
);
`);

console.log("=== PostgreSQL connecté avec succès et tables initialisées ===");
} catch (err) {
console.error("!!! ERREUR DE CONNEXION POSTGRESQL :", err.message);
// On ne coupe plus le serveur avec process.exit(1) pour laisser le temps de lire le log en ligne
}
};

initDB();

module.exports = pool;
