# Flash Industriel — Guide d'installation SQL Server

## Ce dont vous avez besoin

| Logiciel | Version minimale | Gratuit ? |
|---------|-----------------|-----------|
| Node.js | 18+ | ✅ Oui |
| SQL Server | 2016+ (requis pour JSON) | Licence IT |
| SQL Server Management Studio (SSMS) | Toute version | ✅ Oui |

---

## Étape 1 — Créer la base de données

Dans SQL Server Management Studio, exécuter le fichier `schema-sqlserver.sql` :

```sql
CREATE DATABASE flash_industriel;
GO
USE flash_industriel;
GO
-- puis coller le contenu de schema-sqlserver.sql
```

---

## Étape 2 — Créer un utilisateur SQL pour l'appli

```sql
CREATE LOGIN flash_user WITH PASSWORD = 'VotreMotDePasse123!';
USE flash_industriel;
CREATE USER flash_user FOR LOGIN flash_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON flash_sessions TO flash_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON submissions   TO flash_user;
```

---

## Étape 3 — Installer Node.js

Télécharger sur : https://nodejs.org/en/download
Choisir la version **LTS (18 ou 20)**.

---

## Étape 4 — Préparer le dossier de l'application

1. Extraire le ZIP du projet dans un dossier (ex: `C:\FlashIndustriel`)
2. **Renommer** `server-sqlserver.js` en `server.js` (remplacer le fichier existant)
3. Copier `.env.example` (dans le dossier `database\`) à la racine du projet, renommer en `.env`
4. Ouvrir `.env` et remplir les valeurs :

```
PORT=3001
DB_SERVER=VOTRE_SERVEUR_SQL
DB_NAME=flash_industriel
DB_USER=flash_user
DB_PASSWORD=VotreMotDePasse123!
DB_PORT=1433
```

---

## Étape 5 — Installer les dépendances Node.js

Ouvrir une invite de commandes dans le dossier du projet :

```bash
npm install
npm install mssql
```

> ⚠️ Le `package.json` liste `pg` (PostgreSQL). Pour SQL Server, seul `mssql` est utilisé.
> La commande `npm install mssql` suffit — pas besoin de désinstaller `pg`.

---

## Étape 6 — Lancer l'application

```bash
node server.js
```

Vous devriez voir :
```
Base de données SQL Server initialisée ✅
Flash Industriel (SQL Server) → http://localhost:3001
```

L'application est accessible depuis n'importe quel navigateur du réseau :
```
http://VOTRE_SERVEUR:3001
```

---

## Étape 7 — Démarrage automatique (optionnel)

Pour que l'appli redémarre automatiquement avec le serveur Windows,
utiliser **pm2** ou créer un service Windows :

```bash
npm install -g pm2
pm2 start server.js --name flash-industriel
pm2 startup
pm2 save
```

---

## Structure de la base de données

### Table `flash_sessions`
Une ligne par jour de saisie.

| Colonne | Type | Description |
|--------|------|-------------|
| id | INT IDENTITY | Identifiant auto |
| date | NVARCHAR(10) | Format AAAA-MM-JJ |
| created_at | DATETIME2 | Date de création |

### Table `submissions`
Une ligne par **service** et par **jour** (max 5 lignes/jour).
Services : `securite` · `production` · `qualite` · `maintenance` · `utilites`

| Colonne | Type | Description |
|--------|------|-------------|
| id | INT IDENTITY | Identifiant auto |
| session_date | NVARCHAR(10) | Format AAAA-MM-JJ |
| service | NVARCHAR(50) | Nom du service |
| data | NVARCHAR(MAX) | Contenu JSON du formulaire |
| submitted_at | DATETIME2 | Horodatage |

---

## En cas de problème

### Erreur de connexion
- Vérifier que SQL Server accepte les connexions TCP/IP  
  (SQL Server Configuration Manager → Protocols → TCP/IP → Enabled)
- Vérifier que le port 1433 est ouvert dans le firewall Windows
- Vérifier les identifiants dans `.env`

### Erreur JSON_VALUE
- Requiert SQL Server 2016 minimum
- Vérifier avec : `SELECT @@VERSION`
