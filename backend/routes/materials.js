const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../database'); // Importation du pool PostgreSQL
const { authMiddleware } = require('../middleware');
const router = express.Router();

// 1. RÉCUPÉRER TOUS LES MATÉRIAUX D'UNE QUINCAILLERIE
router.get('/', authMiddleware, async (req, res) => {
const storeId = req.user.store_id;

try {
const result = await pool.query(
'SELECT * FROM materials WHERE store_id = $1 ORDER BY name ASC',
[storeId]
);
res.json(result.rows); // On renvoie uniquement le tableau des lignes
} catch (e) {
console.error(e);
res.status(500).json({ error: 'Erreur serveur lors de la récupération de l\'inventaire.' });
}
});

// 2. AJOUTER UN NOUVEAU MATÉRIAU
router.post('/', authMiddleware, async (req, res) => {
const storeId = req.user.store_id;
const { name, category, stockQuantity, unit, purchasePrice, sellingPrice } = req.body;

if (!name?.trim()) {
return res.status(400).json({ error: 'Le nom du matériau est obligatoire.' });
}

try {
const id = uuidv4();

await pool.query(
`INSERT INTO materials (id, store_id, name, category, stock_quantity, unit, purchase_price, selling_price)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
[
id,
storeId,
name.trim(),
category?.trim() || 'Général',
Number(stockQuantity) || 0,
unit?.trim() || 'pièce',
Number(purchasePrice) || 0,
Number(sellingPrice) || 0
]
);

const created = await pool.query('SELECT * FROM materials WHERE id = $1', [id]);
res.status(201).json(created.rows[0]);
} catch (e) {
console.error(e);
res.status(500).json({ error: 'Erreur serveur lors de l\'ajout du matériau.' });
}
});

// 3. MODIFIER UN MATÉRIAU EXISTANT
router.put('/:id', authMiddleware, async (req, res) => {
const storeId = req.user.store_id;
const { id } = req.params;
const { name, category, stockQuantity, unit, purchasePrice, sellingPrice } = req.body;

try {
// Vérification de la propriété du matériau
const check = await pool.query('SELECT id FROM materials WHERE id = $1 AND store_id = $2', [id, storeId]);
if (check.rows.length === 0) {
return res.status(404).json({ error: 'Matériau introuvable.' });
}

await pool.query(
`UPDATE materials
SET name = $1, category = $2, stock_quantity = $3, unit = $4, purchase_price = $5, selling_price = $6
WHERE id = $7 AND store_id = $8`,
[
name.trim(),
category?.trim() || 'Général',
Number(stockQuantity) || 0,
unit?.trim() || 'pièce',
Number(purchasePrice) || 0,
Number(sellingPrice) || 0,
id,
storeId
]
);

const updated = await pool.query('SELECT * FROM materials WHERE id = $1', [id]);
res.json(updated.rows[0]);
} catch (e) {
console.error(e);
res.status(500).json({ error: 'Erreur serveur lors de la modification.' });
}
});

// 4. SUPPRIMER UN MATÉRIAU
router.delete('/:id', authMiddleware, async (req, res) => {
const storeId = req.user.store_id;
const { id } = req.params;

try {
const result = await pool.query('DELETE FROM materials WHERE id = $1 AND store_id = $2', [id, storeId]);

// Le driver 'pg' retourne le nombre de lignes affectées dans 'rowCount'
if (result.rowCount === 0) {
return res.status(404).json({ error: 'Matériau introuvable ou déjà supprimé.' });
}

res.json({ success: true, message: 'Matériau supprimé de l\'inventaire.' });
} catch (e) {
console.error(e);
res.status(500).json({ error: 'Erreur serveur lors de la suppression.' });
}
});

module.exports = router;

