const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../database');
const { authMiddleware } = require('../middleware');
const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
try {
const result = await pool.query('SELECT * FROM team WHERE store_id = $1 ORDER BY full_name ASC', [req.user.store_id]);
res.json(result.rows);
} catch (e) { res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.post('/', authMiddleware, async (req, res) => {
const { fullName, phone, salary } = req.body;
if (!fullName?.trim()) return res.status(400).json({ error: 'Nom obligatoire.' });
try {
const id = uuidv4();
await pool.query('INSERT INTO team (id, store_id, full_name, phone, salary) VALUES ($1, $2, $3, $4, $5)', [id, req.user.store_id, fullName.trim(), phone || '', Number(salary) || 0]);
const created = await pool.query('SELECT * FROM team WHERE id = $1', [id]);
res.status(201).json(created.rows[0]);
} catch (e) { res.status(500).json({ error: 'Erreur serveur.' }); }
});

router.delete('/:id', authMiddleware, async (req, res) => {
try {
const result = await pool.query('DELETE FROM team WHERE id = $1 AND store_id = $2', [req.params.id, req.user.store_id]);
if (result.rowCount === 0) return res.status(404).json({ error: 'Introuvable.' });
res.json({ success: true });
} catch (e) { res.status(500).json({ error: 'Erreur serveur.' }); }
});

module.exports = router;

