const express = require('express');
const { exec } = require('child_process');
const { authMiddleware } = require('../middleware');
const router = express.Router();

router.post('/export', authMiddleware, (req, res) => {
// Sur Render ou en local, on utilise pg_dump via les variables d'environnement
const connectionString = process.env.DATABASE_URL || 'postgresql://adnel:password123@localhost:5432/bestquinca_local';

exec(`pg_dump "${connectionString}"`, (error, stdout, stderr) => {
if (error) {
console.error(`Erreur d'export : ${error.message}`);
return res.status(500).json({ error: 'Impossible de générer la sauvegarde système.' });
}

// On renvoie directement le fichier SQL brut au frontend pour téléchargement
res.setHeader('Content-Type', 'text/plain');
res.setHeader('Content-Disposition', `attachment; filename=backup-bestquinca-${Date.now()}.sql`);
res.send(stdout);
});
});

module.exports = router;

