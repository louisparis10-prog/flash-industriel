const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Initialisation des tables
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS flash_sessions (
      id SERIAL PRIMARY KEY,
      date TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS submissions (
      id SERIAL PRIMARY KEY,
      session_date TEXT NOT NULL,
      service TEXT NOT NULL,
      data TEXT NOT NULL,
      submitted_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(session_date, service)
    );
  `);
  console.log('Base de données initialisée ✅');
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/sessions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM flash_sessions ORDER BY date DESC LIMIT 30');
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/sessions', async (req, res) => {
  const { date } = req.body;
  if (!date) return res.status(400).json({ error: 'date requis' });
  try {
    await pool.query('INSERT INTO flash_sessions (date) VALUES ($1) ON CONFLICT (date) DO NOTHING', [date]);
    const result = await pool.query('SELECT * FROM flash_sessions WHERE date = $1', [date]);
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/submissions/:date', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM submissions WHERE session_date = $1', [req.params.date]);
    const out = {};
    result.rows.forEach(r => { out[r.service] = JSON.parse(r.data); });
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/submissions/:date/:service', async (req, res) => {
  const { date, service } = req.params;
  const services = ['securite', 'production', 'qualite', 'maintenance', 'utilites'];
  if (!services.includes(service)) return res.status(400).json({ error: 'service invalide' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'format de date invalide' });

  try {
    await pool.query('INSERT INTO flash_sessions (date) VALUES ($1) ON CONFLICT (date) DO NOTHING', [date]);
    await pool.query(`
      INSERT INTO submissions (session_date, service, data)
      VALUES ($1, $2, $3)
      ON CONFLICT (session_date, service) DO UPDATE SET data = EXCLUDED.data, submitted_at = NOW()
    `, [date, service, JSON.stringify(req.body)]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Données mensuelles pour les graphiques tendances
app.get('/api/monthly/:year/:month', async (req, res) => {
  const { year, month } = req.params;
  if (!/^\d{4}$/.test(year) || !/^\d{1,2}$/.test(month) || +month < 1 || +month > 12)
    return res.status(400).json({ error: 'paramètres invalides' });
  const prefix = `${year}-${month.padStart(2, '0')}%`;
  try {
    const result = await pool.query(
      'SELECT * FROM submissions WHERE session_date LIKE $1 ORDER BY session_date ASC',
      [prefix]
    );
    const byDate = {};
    result.rows.forEach(r => {
      if (!byDate[r.session_date]) byDate[r.session_date] = {};
      byDate[r.session_date][r.service] = JSON.parse(r.data);
    });
    res.json(byDate);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/status/:date', async (req, res) => {
  try {
    const result = await pool.query('SELECT service FROM submissions WHERE session_date = $1', [req.params.date]);
    const submitted = result.rows.map(r => r.service);
    const all = ['securite', 'production', 'qualite', 'maintenance', 'utilites'];
    res.json({
      submitted,
      complete: all.every(s => submitted.includes(s)),
      missing: all.filter(s => !submitted.includes(s))
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Données par grade (référence produit) — pour les graphiques grade/comparatif
app.get('/api/grade', async (req, res) => {
  try {
    const { ref } = req.query;
    if (!ref) return res.json([]);
    const result = await pool.query(
      `SELECT session_date, data FROM submissions
       WHERE service = 'production'
       AND (data::jsonb->>'m1_ref' = $1 OR data::jsonb->>'m3_ref' = $1)
       ORDER BY session_date ASC`,
      [ref]
    );
    const rows = result.rows.map(r => ({ date: r.session_date, ...JSON.parse(r.data) }));
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Tous les jours de production (pour comparatif inter-grades)
app.get('/api/all-grades', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT session_date, data FROM submissions WHERE service = 'production' ORDER BY session_date ASC`
    );
    const rows = result.rows.map(r => ({ date: r.session_date, ...JSON.parse(r.data) }));
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Flash Industriel → http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Erreur connexion DB:', err.message);
  process.exit(1);
});
