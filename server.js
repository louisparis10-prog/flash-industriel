const express = require('express');
const path = require('path');
const { Database } = require('node-sqlite3-wasm');

const app = express();
const PORT = 3001;

const db = new Database(path.join(__dirname, 'flash.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS flash_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_date TEXT NOT NULL,
    service TEXT NOT NULL,
    data TEXT NOT NULL,
    submitted_at TEXT DEFAULT (datetime('now')),
    UNIQUE(session_date, service)
  );
`);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/sessions', (req, res) => {
  const rows = db.prepare('SELECT * FROM flash_sessions ORDER BY date DESC LIMIT 30').all();
  res.json(rows);
});

app.post('/api/sessions', (req, res) => {
  const { date } = req.body;
  if (!date) return res.status(400).json({ error: 'date requis' });
  try {
    db.prepare('INSERT OR IGNORE INTO flash_sessions (date) VALUES (?)').run([date]);
    const row = db.prepare('SELECT * FROM flash_sessions WHERE date = ?').get([date]);
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/submissions/:date', (req, res) => {
  const rows = db.prepare('SELECT * FROM submissions WHERE session_date = ?').all([req.params.date]);
  const result = {};
  rows.forEach(r => { result[r.service] = JSON.parse(r.data); });
  res.json(result);
});

app.post('/api/submissions/:date/:service', (req, res) => {
  const { date, service } = req.params;
  const services = ['securite', 'production', 'qualite', 'maintenance', 'utilites'];
  if (!services.includes(service)) return res.status(400).json({ error: 'service invalide' });

  db.prepare('INSERT OR IGNORE INTO flash_sessions (date) VALUES (?)').run([date]);
  db.prepare(`
    INSERT INTO submissions (session_date, service, data)
    VALUES (?, ?, ?)
    ON CONFLICT(session_date, service) DO UPDATE SET data = excluded.data, submitted_at = datetime('now')
  `).run([date, service, JSON.stringify(req.body)]);

  res.json({ ok: true });
});

app.get('/api/status/:date', (req, res) => {
  const rows = db.prepare('SELECT service FROM submissions WHERE session_date = ?').all([req.params.date]);
  const submitted = rows.map(r => r.service);
  const all = ['securite', 'production', 'qualite', 'maintenance', 'utilites'];
  res.json({
    submitted,
    complete: all.every(s => submitted.includes(s)),
    missing: all.filter(s => !submitted.includes(s))
  });
});

app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Flash Industriel → http://localhost:${PORT}`);
});
