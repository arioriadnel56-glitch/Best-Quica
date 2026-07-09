const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../database'); // Importation du pool PostgreSQL
const { authMiddleware } = require('../middleware');
const router = express.Router();

// 1. RÉCUPÉRER TOUTES LES VENTES DE LA QUINCAILLERIE
router.get('/', authMiddleware, async (req, res) => {
const storeId = req.user.store_id;

try {
const result = await pool.query(
`SELECT s.*, u.full_name as seller_name
FROM sales s
LEFT JOIN users u ON s.user_id = u.id
WHERE s.store_id = $1
ORDER BY s.created_at DESC`,
[storeId]
);
res.json(result.rows);
} catch (e) {
console.error(e);
res.status(500).json({ error: 'Erreur serveur lors de la récupération des ventes.' });
}
});

// 2. ENREGISTRER UNE NOUVELLE VENTE (AVEC MISE À JOUR DES STOCKS)
router.post('/', authMiddleware, async (req, res) => {
const storeId = req.user.store_id;
const userId = req.user.id;
// On s'attend à recevoir la liste des articles : items = [{ materialId, quantity, unitPrice }]
const { customerName, totalAmount, paymentMethod, items } = req.body;

if (!items || !Array.isArray(items) || items.length === 0) {
return res.status(400).json({ error: 'Une vente doit contenir au moins un article.' });
}

// Isolation d'un client du pool pour la transaction transactionnelle
const client = await pool.connect();

try {
// Début de la transaction
await client.query('BEGIN');

const saleId = uuidv4();

// 1. Insertion de la vente principale
await client.query(
`INSERT INTO sales (id, store_id, user_id, customer_name, total_amount, payment_method)
VALUES ($1, $2, $3, $4, $5, $6)`,
[
saleId,
storeId,
userId,
customerName?.trim() || 'Client Comptant',
Number(totalAmount) || 0,
paymentMethod || 'Espèces'
]
);

// 2. Boucle de mise à jour des stocks pour chaque matériau vendu
for (const item of items) {
const { materialId, quantity } = item;

// Vérifier si le matériau existe et récupérer son stock actuel
const matCheck = await client.query(
'SELECT stock_quantity, name FROM materials WHERE id = $1 AND store_id = $2',
[materialId, storeId]
);

if (matCheck.rows.length === 0) {
throw new Error(`Matériau introuvable.`);
}

const currentStock = Number(matCheck.rows[0].stock_quantity);
const qtyToSubtract = Number(quantity);

if (currentStock < qtyToSubtract) {
return res.status(400).json({
error: `Stock insuffisant pour le produit : ${matCheck.rows[0].name}. (Disponible: ${currentStock})`
});
}

// Déduction du stock
await client.query(
'UPDATE materials SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND store_id = $3',
[qtyToSubtract, materialId, storeId]
);
}

// Si tout s'est bien passé, on valide la transaction en base
await client.query('COMMIT');

// Récupération de la vente enregistrée pour la renvoyer au frontend
const finalSale = await pool.query('SELECT * FROM sales WHERE id = $1', [saleId]);
res.status(201).json(finalSale.rows[0]);

} catch (e) {
// En cas d'erreur ou de plantage, on annule TOUT (les stocks restent intacts)
await client.query('ROLLBACK');
console.error(e);
res.status(500).json({ error: 'Erreur critique lors de l\'enregistrement de la vente.' });
} finally {
// Libération obligatoire du client
client.release();
}
});

module.exports = router;

