const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../database');
const { authMiddleware } = require('../middleware');
const router = express.Router();

// Récupérer les factures
router.get('/', authMiddleware, async (req, res) => {
try {
const result = await pool.query(
`SELECT i.*, c.name as client_name
FROM invoices i
LEFT JOIN clients c ON i.client_id = c.id
WHERE i.store_id = $1 ORDER BY i.created_at DESC`,
[req.user.store_id]
);
res.json(result.rows);
} catch (e) {
console.error(e);
res.status(500).json({ error: 'Erreur serveur.' });
}
});

// Créer une facture
router.post('/', authMiddleware, async (req, res) => {
const { clientId, totalAmount, status } = req.body;
const storeId = req.user.store_id;

try {
const id = uuidv4();
// Génération d'un numéro de facture basé sur le timestamp pour éviter les doublons
const invoiceNumber = `FACT-${Date.now().toString().slice(-6)}`;

await pool.query(
'INSERT INTO invoices (id, store_id, client_id, invoice_number, total_amount, status) VALUES ($1, $2, $3, $4, $5, $6)',
[id, storeId, clientId || null, invoiceNumber, Number(totalAmount) || 0, status || 'impayé']
);

const created = await pool.query('SELECT * FROM invoices WHERE id = $1', [id]);
res.status(201).json(created.rows[0]);
} catch (e) {
console.error(e);
res.status(500).json({ error: 'Erreur serveur.' });
}
});

module.exports = router;

