const { Pool } = require('pg');

// 1. Configuration dynamique de l'URL de connexion
// En local sur ton Chromebook, il utilisera la chaîne par défaut.
// Sur Render, il utilisera automatiquement la variable d'environnement DATABASE_URL.
const isProduction = process.env.NODE_ENV === 'production';

const connectionString = process.env.DATABASE_URL || 'postgresql://adnel:password123@localhost:5432/bestquinca_local';

const pool = new Pool({
connectionString: connectionString,
ssl: isProduction ? { rejectUnauthorized: false } : false
});

// 2. Initialisation asynchrone des tables
const initDB = async () => {
try {
// Requête SQL de création des tables adaptée à PostgreSQL
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
;

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
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../database');
const { authMiddleware } = require('../middleware');
const router = express.Router();

// 1. RÉCUPÉRER TOUS LES CLIENTS
router.get('/', authMiddleware, async (req, res) => {
const storeId = req.user.store_id;

try {
const result = await pool.query(
'SELECT * FROM clients WHERE store_id = $1 ORDER BY name ASC',
[storeId]
);
res.json(result.rows);
} catch (e) {
console.error(e);
res.status(500).json({ error: 'Erreur serveur lors de la récupération des clients.' });
}
});

// 2. AJOUTER UN CLIENT
router.post('/', authMiddleware, async (req, res) => {
const storeId = req.user.store_id;
const { name, phone, debt } = req.body;

if (!name?.trim()) {
return res.status(400).json({ error: 'Le nom du client est obligatoire.' });
}

try {
const id = uuidv4();
await pool.query(
'INSERT INTO clients (id, store_id, name, phone, debt) VALUES ($1, $2, $3, $4, $5)',
[id, storeId, name.trim(), phone?.trim() || '', Number(debt) || 0]
);

const created = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
res.status(201).json(created.rows[0]);
} catch (e) {
console.error(e);
res.status(500).json({ error: 'Erreur serveur lors de l\'ajout du client.' });
}
});

// 3. MODIFIER UN CLIENT
router.put('/:id', authMiddleware, async (req, res) => {
const storeId = req.user.store_id;
const { id } = req.params;
const { name, phone, debt } = req.body;

try {
const check = await pool.query('SELECT id FROM clients WHERE id = $1 AND store_id = $2', [id, storeId]);
if (check.rows.length === 0) {
return res.status(404).json({ error: 'Client introuvable.' });
}

await pool.query(
'UPDATE clients SET name = $1, phone = $2, debt = $3 WHERE id = $4 AND store_id = $5',
[name.trim(), phone?.trim() || '', Number(debt) || 0, id, storeId]
);

const updated = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
res.json(updated.rows[0]);
} catch (e) {
console.error(e);
res.status(500).json({ error: 'Erreur serveur lors de la modification du client.' });
}
});

// 4. SUPPRIMER UN CLIENT
router.delete('/:id', authMiddleware, async (req, res) => {
const storeId = req.user.store_id;
const { id } = req.params;

try {
const result = await pool.query('DELETE FROM clients WHERE id = $1 AND store_id = $2', [id, storeId]);
if (result.rowCount === 0) {
return res.status(404).json({ error: 'Client introuvable.' });
}
res.json({ success: true, message: 'Client supprimé.' });
} catch (e) {
console.error(e);
res.status(500).json({ error: 'Erreur serveur lors de la suppression.' });
}
});

module.exports = router;

await pool.query(`
-- ... (tables précédentes)

CREATE TABLE IF NOT EXISTS sales (
id TEXT PRIMARY KEY,
store_id TEXT NOT NULL,
user_id TEXT NOT NULL,
customer_name TEXT DEFAULT 'Client Comptant',
total_amount NUMERIC DEFAULT 0,
payment_method TEXT DEFAULT 'Espèces', -- 'Espèces', 'Mobile Money', 'Chèque'
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE,
await pool.query(`
-- ... (tables précédentes)

CREATE TABLE IF NOT EXISTS clients (
id TEXT PRIMARY KEY,
store_id TEXT NOT NULL,
name TEXT NOT NULL,
phone TEXT DEFAULT '',
debt NUMERIC DEFAULT 0,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
status TEXT DEFAULT 'disponible', -- 'disponible', 'en livraison', 'en panne'
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE
);
`);

FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE
);
`);FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
);
`);
console.log("=== PostgreSQL connecté avec succès et tables initialisées ===");
} catch (err) {
console.error("!!! Erreur critique lors de l'initialisation de PostgreSQL :", err.message);
process.exit(1); // Arrête le serveur si la base de données est inaccessible
}
};

// Lancement de l'initialisation
initDB();
await pool.query(`
-- ... (tables précédentes)

CREATE TABLE IF NOT EXISTS invoices (
id TEXT PRIMARY KEY,
store_id TEXT NOT NULL,
client_id TEXT,
invoice_number TEXT NOT NULL,
total_amount NUMERIC DEFAULT 0,
status TEXT DEFAULT 'impayé', -- 'payé', 'impayé', 'partiel'
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY(store_id) REFERENCES stores(id) ON DELETE CASCADE,
FOREIGN KEY(client_id) REFERENCES clients(id) ON DELETE SET NULL
);
`);

// On exporte le pool pour effectuer nos requêtes dans les routes
module.exports = pool;




