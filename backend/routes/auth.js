const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../database'); // Importation du pool PostgreSQL
const { generateToken, authMiddleware } = require('../middleware');
const router = express.Router();

// 1. ROUTE D'INSCRIPTION (REGISTER)
router.post('/register', async (req, res) => {
const { storeName, city, phone, fullName, email, password } = req.body;

if (!storeName?.trim() || !city?.trim() || !fullName?.trim() || !email?.trim() || !password) {
return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis.' });
}
if (!email.includes('@')) {
return res.status(400).json({ error: 'E-mail invalide.' });
}
if (password.length < 8) {
return res.status(400).json({ error: 'Mot de passe minimum 8 caractères.' });
}

// Obtenir un client du pool pour gérer la transaction de manière sécurisée
const client = await pool.connect();

try {
// Vérifier si l'utilisateur existe déjà
const userCheck = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
if (userCheck.rows.length > 0) {
return res.status(409).json({ error: 'E-mail déjà utilisé.' });
}

const storeId = uuidv4();
const userId = uuidv4();
const hash = await bcrypt.hash(password, 12);

// Début de la transaction PostgreSQL
await client.query('BEGIN');

// Insertion de la boutique (Stores)
await client.query(
'INSERT INTO stores (id, name, city, phone) VALUES ($1, $2, $3, $4)',
[storeId, storeName.trim(), city.trim(), phone?.trim() || '']
);

// Insertion de l'utilisateur administrateur (Owner)
await client.query(
'INSERT INTO users (id, store_id, full_name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5, $6)',
[userId, storeId, fullName.trim(), email.toLowerCase().trim(), hash, 'owner']
);

// Validation définitive de la transaction
await client.query('COMMIT');

// Récupération des données fraîches pour la réponse
const userRes = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
const storeRes = await client.query('SELECT * FROM stores WHERE id = $1', [storeId]);

const user = userRes.rows[0];
const store = storeRes.rows[0];

res.status(201).json({
token: generateToken(user),
user: { id: user.id, store_id: user.store_id, full_name: user.full_name, email: user.email, role: user.role },
store: store
});

} catch (e) {
// En cas d'erreur, on annule tout ce qui a été fait dans la transaction
await client.query('ROLLBACK');
console.error(e);
res.status(500).json({ error: 'Erreur serveur lors de l\'inscription.' });
} finally {
// Toujours libérer le client pour le rendre au pool
client.release();
}
});

// 2. ROUTE DE CONNEXION (LOGIN)
router.post('/login', async (req, res) => {
const { email, password } = req.body;

if (!email?.trim() || !password) {
return res.status(400).json({ error: 'E-mail et mot de passe requis.' });
}

try {
// Recherche de l'utilisateur avec PostgreSQL
const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
const user = userResult.rows[0];

if (!user) {
return res.status(401).json({ error: 'Aucun compte avec cet e-mail.' });
}

// Vérification du mot de passe crypté
const isMatch = await bcrypt.compare(password, user.password_hash);
if (!isMatch) {
return res.status(401).json({ error: 'Mot de passe incorrect.' });
}

// Récupération de la boutique associée
const storeResult = await pool.query('SELECT * FROM stores WHERE id = $1', [user.store_id]);
const store = storeResult.rows[0];

res.json({
token: generateToken(user),
user: { id: user.id, store_id: user.store_id, full_name: user.full_name, email: user.email, role: user.role },
store: store
});

} catch (e) {
console.error(e);
res.status(500).json({ error: 'Erreur serveur lors de la connexion.' });
}
});

module.exports = router;

