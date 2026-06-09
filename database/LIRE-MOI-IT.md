# Flash Industriel — Instructions base de données pour l'IT

## Contexte

L'application Flash Industriel utilise une base de données simple avec **2 tables**.
Elle a été développée avec **PostgreSQL** (via la bibliothèque `pg` pour Node.js).

---

## Option A — PostgreSQL (recommandé, zéro modification du code)

> PostgreSQL est gratuit et open-source. C'est la solution qui demande le moins de travail.

### 1. Installer PostgreSQL
Téléchargement : https://www.postgresql.org/download/windows/

### 2. Créer la base
```sql
CREATE DATABASE flash_industriel;
```

### 3. Exécuter le schéma
Ouvrir `schema-postgresql.sql` dans pgAdmin ou via psql et l'exécuter.

### 4. Configurer la variable d'environnement dans le serveur
Dans le fichier `.env` (à créer à la racine du projet) :
```
DATABASE_URL=postgresql://USER:MOT_DE_PASSE@localhost:5432/flash_industriel
PORT=3001
```

### 5. Lancer l'application
```bash
npm install
node server.js
```

---

## Option B — SQL Server 2016+ (nécessite des modifications du code)

> SQL Server est compatible mais **server.js doit être modifié** pour utiliser
> le driver `mssql` au lieu de `pg`.

### 1. Exécuter le schéma
Ouvrir `schema-sqlserver.sql` dans SQL Server Management Studio (SSMS) et l'exécuter.

### 2. Remplacer le driver Node.js
```bash
npm uninstall pg
npm install mssql
```

### 3. Modifier server.js — connexion
Remplacer :
```js
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: ... });
```
Par :
```js
const sql = require('mssql');
const poolPromise = sql.connect({
  server: 'VOTRE_SERVEUR',
  database: 'flash_industriel',
  user: 'VOTRE_USER',
  password: 'VOTRE_MOT_DE_PASSE',
  options: { encrypt: true, trustServerCertificate: true }
});
```

### 4. Différences de syntaxe SQL à adapter dans server.js

| PostgreSQL (actuel)            | SQL Server (à utiliser)               |
|-------------------------------|---------------------------------------|
| `$1, $2, $3`                  | `@param1, @param2, @param3`          |
| `ON CONFLICT ... DO UPDATE`   | `MERGE` ou vérification avant INSERT |
| `data::jsonb->>'m1_ref'`      | `JSON_VALUE(data, '$.m1_ref')`       |
| `SERIAL PRIMARY KEY`          | `INT IDENTITY(1,1) PRIMARY KEY`      |
| `TIMESTAMP DEFAULT NOW()`     | `DATETIME2 DEFAULT GETDATE()`        |

---

## Structure des données

### Table `flash_sessions`
Une ligne par jour de saisie.

| Colonne      | Type   | Description              |
|-------------|--------|--------------------------|
| id          | Int    | Identifiant auto         |
| date        | Texte  | Date au format AAAA-MM-JJ |
| created_at  | Date   | Date de création         |

### Table `submissions`
Une ligne par **service** et par **jour**.
Les 5 services : `securite`, `production`, `qualite`, `maintenance`, `utilites`

| Colonne        | Type   | Description                         |
|---------------|--------|-------------------------------------|
| id            | Int    | Identifiant auto                    |
| session_date  | Texte  | Date au format AAAA-MM-JJ           |
| service       | Texte  | Nom du service (ex: "production")   |
| data          | JSON   | Tous les champs du formulaire       |
| submitted_at  | Date   | Horodatage de la soumission         |

### Exemple de contenu de la colonne `data` (service = "production")
```json
{
  "animateur": "Paul Martin",
  "statut_global": "orange",
  "m1_ref": "Produit A",
  "m1_statut": "orange",
  "m1_prod_cumul": "145",
  "m1_prod_cible": "160",
  "m1_rdt_cumul": "72",
  "m1_rdt_cible": "80/90",
  "commentaire_general": "Arrêt technique 2h sur M1"
}
```
