const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

require('./database');

const app  = express();
const PORT = process.env.PORT || 8081;
app.use(cors({ origin: '*' }));

app.use(express.json({ limit: '25mb' }));

// ── API Routes ─────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/clients',   require('./routes/clients'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/invoices',  require('./routes/invoices'));
app.use('/api/sales',     require('./routes/sales'));
app.use('/api/trucks',    require('./routes/trucks'));
app.use('/api/team',      require('./routes/team'));
app.use('/api/backup',    require('./routes/backup'));
app.get('/api/health',    (req, res) => res.json({ status:'ok', app:'Best-Quinca', version:'1.0.0' }));

// ── Route téléchargement installateur Windows ──────────────────
app.get('/download/windows', (req, res) => {
  const file = path.join(__dirname, '..', 'downloads', 'BestQuinca-Setup-Windows.exe');
  if (fs.existsSync(file)) {
    res.download(file, 'BestQuinca-Setup-Windows.exe');
  } else {
    // Si le .exe n'est pas encore compilé, proposer le ZIP portable
    const zip = path.join(__dirname, '..', 'downloads', 'BestQuinca-Windows-Portable.zip');
    if (fs.existsSync(zip)) {
      res.download(zip, 'BestQuinca-Windows-Portable.zip');
    } else {
      res.status(404).json({ error: 'Fichier non disponible.' });
    }
  }
});

// ── Servir la Landing Page sur / ──────────────────────────────
const landingDist = path.join(__dirname, '..', 'landing', 'dist');
const landingPublic = path.join(__dirname, '..', 'landing', 'public');

if (fs.existsSync(landingDist)) {
  app.use('/', express.static(landingDist));
} else if (fs.existsSync(landingPublic)) {
  app.use('/', express.static(landingPublic));
}

// ── Servir l'application React sur /app ───────────────────────
const appDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(appDist)) {
  app.use('/app', express.static(appDist));
  app.get('/app/*', (req, res) => {
    res.sendFile(path.join(appDist, 'index.html'));
  });
}

// ── Route landing fallback (fichier HTML statique) ─────────────
app.get('/', (req, res) => {
  const html = path.join(__dirname, '..', 'landing', 'index.html');
  if (fs.existsSync(html)) res.sendFile(html);
  else res.redirect('/app');
});

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: 'Erreur serveur.' });
});

app.listen(PORT, () => {
  console.log(`\n🏪 Best-Quinca démarré sur http://localhost:${PORT}`);
  console.log(`   Landing : http://localhost:${PORT}/`);
  console.log(`   App     : http://localhost:${PORT}/app\n`);
});
