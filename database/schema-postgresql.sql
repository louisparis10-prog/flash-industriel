-- ============================================================
-- FLASH INDUSTRIEL — Schéma base de données PostgreSQL
-- Compatible : PostgreSQL 13+
-- ============================================================

-- Table des sessions (une par jour de saisie)
CREATE TABLE IF NOT EXISTS flash_sessions (
  id         SERIAL PRIMARY KEY,
  date       TEXT NOT NULL UNIQUE,   -- format YYYY-MM-DD
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table des soumissions (un enregistrement par service et par jour)
-- service : 'securite' | 'production' | 'qualite' | 'maintenance' | 'utilites'
-- data    : JSON stocké en texte (tous les champs du formulaire)
CREATE TABLE IF NOT EXISTS submissions (
  id             SERIAL PRIMARY KEY,
  session_date   TEXT NOT NULL,
  service        TEXT NOT NULL,
  data           TEXT NOT NULL,         -- contenu JSON (ex: {"animateur":"Paul","statut_global":"vert",...})
  submitted_at   TIMESTAMP DEFAULT NOW(),
  UNIQUE(session_date, service)
);

-- Index pour accélérer les recherches par date
CREATE INDEX IF NOT EXISTS idx_submissions_date    ON submissions(session_date);
CREATE INDEX IF NOT EXISTS idx_submissions_service ON submissions(service);
