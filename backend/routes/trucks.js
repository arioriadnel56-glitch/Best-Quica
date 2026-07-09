const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../database');
const { authMiddleware } = require('../middleware');
const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
try {
const result = await pool.query('SELECT * FROM trucks WHERE store_id = $1 ORDER BY license_plate ASC', [req.user.store_id]);
res.json(result.rows);
} catch (e) { res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.post('/', authMiddleware, async (req, res) => {
const { licensePlate, model, status } = req.body;
if (!licensePlate?.trim()) return res.status(400).json({ error: 'Plaque requise.' });
try {
const id = uuidv4();
await pool.query('INSERT INTO trucks (id, store_id, license_plate, model, status) VALUES ($1, $2, $3, $4, $5)', [id, req.user.store_id, licensePlate.trim(), model || '', status || 'disponible']);
const created = await pool.query('SELECT * FROM trucks WHERE id = $1', [id]);
res.status(201).json(created.rows[0]);
} catch (e) { res.status(500).json({ error: 'Erreur serveur.' }); }
});

module.exports = router;

