-- ============================================================
-- FLASH INDUSTRIEL — Schéma base de données SQL Server
-- Compatible : SQL Server 2016+ (requis pour JSON_VALUE)
-- ============================================================

-- Table des sessions (une par jour de saisie)
CREATE TABLE flash_sessions (
  id         INT IDENTITY(1,1) PRIMARY KEY,
  date       NVARCHAR(10) NOT NULL UNIQUE,   -- format YYYY-MM-DD
  created_at DATETIME2 DEFAULT GETDATE()
);

-- Table des soumissions (un enregistrement par service et par jour)
-- service : 'securite' | 'production' | 'qualite' | 'maintenance' | 'utilites'
-- data    : JSON stocké en NVARCHAR(MAX) (tous les champs du formulaire)
CREATE TABLE submissions (
  id             INT IDENTITY(1,1) PRIMARY KEY,
  session_date   NVARCHAR(10)    NOT NULL,
  service        NVARCHAR(50)    NOT NULL,
  data           NVARCHAR(MAX)   NOT NULL,   -- contenu JSON
  submitted_at   DATETIME2       DEFAULT GETDATE(),
  CONSTRAINT UQ_submissions UNIQUE (session_date, service)
);

-- Index pour accélérer les recherches par date
CREATE INDEX idx_submissions_date    ON submissions(session_date);
CREATE INDEX idx_submissions_service ON submissions(service);
