// ============================================================
// FLASH INDUSTRIEL — server.js adapté SQL Server
// Driver : mssql  (npm install mssql)
// Requis  : SQL Server 2016+ (pour JSON_VALUE)
// ============================================================

const express  = require('express');
const path     = require('path');
const sql      = require('mssql');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Connexion SQL Server ────────────────────────────────────
// Renseigner ces valeurs dans le fichier .env
const dbConfig = {
  server:   process.env.DB_SERVER   || 'VOTRE_SERVEUR',   // ex: 'SRVPROD\\SQLEXPRESS'
  database: process.env.DB_NAME     || 'flash_industriel',
  user:     process.env.DB_USER     || 'flash_user',
  password: process.env.DB_PASSWORD || 'VOTRE_MOT_DE_PASSE',
  port:     parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt:                true,
    trustServerCertificate: true,   // mettre false en production si certificat SSL valide
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  }
};

let pool;

async function getPool() {
  if (!pool) pool = await sql.connect(dbConfig);
  return pool;
}

// ── Initialisation des tables ───────────────────────────────
async function initDB() {
  const p = await getPool();
  await p.request().query(`
    IF OBJECT_ID('flash_sessions', 'U') IS NULL
    CREATE TABLE flash_sessions (
      id           INT IDENTITY(1,1) PRIMARY KEY,
      date         NVARCHAR(10)  NOT NULL UNIQUE,
      created_at   DATETIME2     DEFAULT GETDATE()
    );
  `);
  await p.request().query(`
    IF OBJECT_ID('submissions', 'U') IS NULL
    CREATE TABLE submissions (
      id             INT IDENTITY(1,1) PRIMARY KEY,
      session_date   NVARCHAR(10)   NOT NULL,
      service        NVARCHAR(50)   NOT NULL,
      data           NVARCHAR(MAX)  NOT NULL,
      submitted_at   DATETIME2      DEFAULT GETDATE(),
      CONSTRAINT UQ_submissions UNIQUE (session_date, service)
    );
  `);
  await p.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_submissions_date')
      CREATE INDEX idx_submissions_date ON submissions(session_date);
  `);
  console.log('Base de données SQL Server initialisée ✅');
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── GET /api/sessions ───────────────────────────────────────
app.get('/api/sessions', async (req, res) => {
  try {
    const p = await getPool();
    const result = await p.request().query(
      'SELECT TOP 30 * FROM flash_sessions ORDER BY date DESC'
    );
    res.json(result.recordset);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/sessions ──────────────────────────────────────
app.post('/api/sessions', async (req, res) => {
  const { date } = req.body;
  if (!date) return res.status(400).json({ error: 'date requis' });
  try {
    const p = await getPool();
    // Insérer seulement si la date n'existe pas
    await p.request()
      .input('date', sql.NVarChar(10), date)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM flash_sessions WHERE date = @date)
          INSERT INTO flash_sessions (date) VALUES (@date)
      `);
    const result = await p.request()
      .input('date', sql.NVarChar(10), date)
      .query('SELECT * FROM flash_sessions WHERE date = @date');
    res.json(result.recordset[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/submissions/:date ──────────────────────────────
app.get('/api/submissions/:date', async (req, res) => {
  try {
    const p = await getPool();
    const result = await p.request()
      .input('date', sql.NVarChar(10), req.params.date)
      .query('SELECT * FROM submissions WHERE session_date = @date');
    const out = {};
    result.recordset.forEach(r => { out[r.service] = JSON.parse(r.data); });
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/submissions/:date/:service ────────────────────
app.post('/api/submissions/:date/:service', async (req, res) => {
  const { date, service } = req.params;
  const services = ['securite', 'production', 'qualite', 'maintenance', 'utilites'];
  if (!services.includes(service))
    return res.status(400).json({ error: 'service invalide' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
    return res.status(400).json({ error: 'format de date invalide' });

  try {
    const p = await getPool();

    // Créer la session si elle n'existe pas
    await p.request()
      .input('date', sql.NVarChar(10), date)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM flash_sessions WHERE date = @date)
          INSERT INTO flash_sessions (date) VALUES (@date)
      `);

    // Upsert : mettre à jour si existe, insérer sinon
    await p.request()
      .input('date',    sql.NVarChar(10),   date)
      .input('service', sql.NVarChar(50),   service)
      .input('data',    sql.NVarChar(sql.MAX), JSON.stringify(req.body))
      .query(`
        MERGE submissions AS target
        USING (VALUES (@date, @service, @data))
              AS source (session_date, service, data)
        ON    target.session_date = source.session_date
          AND target.service      = source.service
        WHEN MATCHED THEN
          UPDATE SET data = source.data, submitted_at = GETDATE()
        WHEN NOT MATCHED THEN
          INSERT (session_date, service, data)
          VALUES (source.session_date, source.service, source.data);
      `);

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/monthly/:year/:month ───────────────────────────
app.get('/api/monthly/:year/:month', async (req, res) => {
  const { year, month } = req.params;
  if (!/^\d{4}$/.test(year) || !/^\d{1,2}$/.test(month) || +month < 1 || +month > 12)
    return res.status(400).json({ error: 'paramètres invalides' });
  const prefix = `${year}-${month.padStart(2, '0')}%`;
  try {
    const p = await getPool();
    const result = await p.request()
      .input('prefix', sql.NVarChar(20), prefix)
      .query(
        'SELECT * FROM submissions WHERE session_date LIKE @prefix ORDER BY session_date ASC'
      );
    const byDate = {};
    result.recordset.forEach(r => {
      if (!byDate[r.session_date]) byDate[r.session_date] = {};
      byDate[r.session_date][r.service] = JSON.parse(r.data);
    });
    res.json(byDate);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/status/:date ───────────────────────────────────
app.get('/api/status/:date', async (req, res) => {
  try {
    const p = await getPool();
    const result = await p.request()
      .input('date', sql.NVarChar(10), req.params.date)
      .query('SELECT service FROM submissions WHERE session_date = @date');
    const submitted = result.recordset.map(r => r.service);
    const all = ['securite', 'production', 'qualite', 'maintenance', 'utilites'];
    res.json({
      submitted,
      complete: all.every(s => submitted.includes(s)),
      missing:  all.filter(s => !submitted.includes(s))
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/grade ──────────────────────────────────────────
app.get('/api/grade', async (req, res) => {
  try {
    const { ref } = req.query;
    if (!ref) return res.json([]);
    const p = await getPool();
    // JSON_VALUE remplace data::jsonb->>'champ' (requiert SQL Server 2016+)
    const result = await p.request()
      .input('ref', sql.NVarChar(200), ref)
      .query(`
        SELECT session_date, data FROM submissions
        WHERE  service = 'production'
          AND  (JSON_VALUE(data, '$.m1_ref') = @ref
             OR JSON_VALUE(data, '$.m3_ref') = @ref)
        ORDER BY session_date ASC
      `);
    const rows = result.recordset.map(r => ({
      date: r.session_date,
      ...JSON.parse(r.data)
    }));
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/search ─────────────────────────────────────────
app.get('/api/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.json([]);
  try {
    // Convertir format DD/MM/YYYY ou DD/MM en YYYY-MM-DD
    let dateQ = q;
    const dmY = q.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/);
    if (dmY) {
      const y = dmY[3] || new Date().getFullYear();
      dateQ = `${y}-${dmY[2].padStart(2,'0')}-${dmY[1].padStart(2,'0')}`;
    }
    const p = await getPool();
    // SQL Server : LIKE est insensible à la casse par défaut (selon le collating du serveur)
    const result = await p.request()
      .input('q',     sql.NVarChar(200), '%' + q + '%')
      .input('dateQ', sql.NVarChar(20),  '%' + dateQ + '%')
      .query(`
        SELECT TOP 80 session_date, service, data
        FROM   submissions
        WHERE  data         LIKE @q
            OR session_date LIKE @dateQ
        ORDER BY session_date DESC, service
      `);
    res.json(result.recordset.map(r => ({
      date:    r.session_date,
      service: r.service,
      data:    JSON.parse(r.data)
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/recap ──────────────────────────────────────────
app.get('/api/recap', async (req, res) => {
  const days = Math.min(parseInt(req.query.days) || 30, 60);
  try {
    const p = await getPool();
    // Une seule requête : sous-sélection des N dernières dates de production
    const dataRes = await p.request()
      .input('days', sql.Int, days)
      .query(`
        SELECT s.session_date, s.service, s.data
        FROM   submissions s
        INNER JOIN (
          SELECT DISTINCT TOP (@days) session_date
          FROM   submissions
          WHERE  service = 'production'
          ORDER BY session_date DESC
        ) AS dates ON s.session_date = dates.session_date
        WHERE  s.service IN ('production', 'securite', 'maintenance')
        ORDER BY s.session_date DESC
      `);

    const byDate = {};
    const orderedDates = [];
    dataRes.recordset.forEach(r => {
      if (!byDate[r.session_date]) {
        byDate[r.session_date] = { date: r.session_date };
        orderedDates.push(r.session_date);
      }
      byDate[r.session_date][r.service] = JSON.parse(r.data);
    });

    // Dédupliquer l'ordre des dates
    const uniqueDates = [...new Set(orderedDates)];
    res.json(uniqueDates.map(d => byDate[d]));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/all-grades ─────────────────────────────────────
app.get('/api/all-grades', async (req, res) => {
  try {
    const p = await getPool();
    const result = await p.request().query(
      `SELECT session_date, data FROM submissions
       WHERE service = 'production'
       ORDER BY session_date ASC`
    );
    const rows = result.recordset.map(r => ({
      date: r.session_date,
      ...JSON.parse(r.data)
    }));
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Fallback SPA ────────────────────────────────────────────
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Démarrage ───────────────────────────────────────────────
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Flash Industriel (SQL Server) → http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Erreur connexion SQL Server:', err.message);
  process.exit(1);
});
