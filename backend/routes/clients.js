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

