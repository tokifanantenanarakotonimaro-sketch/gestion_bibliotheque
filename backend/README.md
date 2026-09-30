# Backend API — Système de Gestion de Bibliothèque

API REST pour le système de gestion de bibliothèque, construite avec **Node.js + Express** et **MongoDB (Mongoose)**, avec authentification **JWT** et mots de passe hachés (**bcrypt**).

## Prérequis

- **Node.js** (v18 ou plus)
- **MongoDB** en local (`mongodb://localhost:27017`) ou une URI distante (Atlas, etc.)

## Démarrage

```bash
# Installer les dépendances
npm install

# Copier la configuration
cp .env.example .env
# → ajuster MONGODB_URI si besoin (défaut : mongodb://localhost:27017/bibliotheque)

# Créer les index (hache aussi les anciens mots de passe en clair)
# — facultatif : npm start / npm run dev exécute cette migration automatiquement
npm run migrate

# Insérer les données initiales
npm run seed

# Démarrer le serveur en mode développement
npm run dev

# Ou en production
npm start

# Lancer la suite de tests
npm test
```

Le serveur démarre sur `http://localhost:3001` par défaut.

> **Compte administrateur créé par le seed :**
> `admin@bibliotheque.com` / `admin123`

## Configuration

Copier `.env.example` vers `.env` et ajuster les variables :

| Variable | Description | Défaut |
|----------|-------------|--------|
| `PORT` | Port du serveur | `3001` |
| `NODE_ENV` | `development` / `production` | `development` |
| `MONGODB_URI` | URI de connexion MongoDB | `mongodb://localhost:27017/bibliotheque` |
| `CORS_ORIGIN` | Origines CORS autorisées (séparées par des virgules) | `http://localhost:5173,...` |
| `JWT_SECRET` | Secret de signature des tokens (**obligatoire en production**) | — |
| `JWT_EXPIRES_IN` | Durée de vie des tokens | `7d` |

## Authentification

Toutes les routes de gestion sont protégées par un token JWT.

```bash
# 1. Connexion
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bibliotheque.com","password":"admin123"}'
# → { "token": "eyJhbGciOi...", "user": { ... } }

# 2. Utilisation du token
curl http://localhost:3001/api/loans \
  -H "Authorization: Bearer eyJhbGciOi..."
```

| Route | Accès |
|-------|-------|
| `GET /api/books` | Public (catalogue consultable sans connexion) |
| Écriture sur `/api/books` | Administrateur |
| `/api/loans`, `/api/users`, `/api/stats` | Connecté |
| Écriture sur `/api/users` | Administrateur |
| `POST /api/auth/login`, `POST /api/auth/register` | Public |

Codes renvoyés : `401` non authentifié, `403` rôle insuffisant.

## API Endpoints

### Livres

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/books` | Liste tous les livres |
| GET | `/api/books?search=terme` | **Recherche par titre ou auteur** |
| GET | `/api/books?category=Roman` | Filtrer par catégorie |
| GET | `/api/books?status=Disponible` | Filtrer par statut |
| GET | `/api/books/categories` | Liste toutes les catégories |
| GET | `/api/books/:id` | Récupère un livre |
| POST | `/api/books` | Crée un livre (admin) |
| PUT | `/api/books/:id` | Met à jour un livre (admin) |
| DELETE | `/api/books/:id` | Supprime un livre (admin, refusé si emprunté) |

### Emprunts

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/loans` | Emprunts en cours (`?userId`, `?bookId`, `?overdue=true`) |
| GET | `/api/loans/history` | Historique des emprunts **retournés** (`?userId`) |
| GET | `/api/loans/history?scope=all` | Historique complet, en cours **et** retournés |
| GET | `/api/loans/history?scope=active` | Uniquement les emprunts en cours |
| GET | `/api/loans/overdue` | Emprunts en retard (échéance dépassée) |
| GET | `/api/loans/:id` | Récupère un emprunt |
| POST | `/api/loans` | Crée un emprunt avec date d'échéance (admin) |
| POST | `/api/loans/:id/return` | Retourne un emprunt (admin) |

- `POST /api/loans` vérifie que le livre existe et est **disponible**, que l'utilisateur existe et est **actif**, et que `due >= start`. Le livre passe en `Emprunté`.
- `POST /api/loans/:id/return` enregistre la date de retour et remet le livre en `Disponible`. Les deux opérations sont **transactionnelles** (session MongoDB).
- Le statut `En retard` est recalculé à la lecture quand l'échéance est dépassée.

### Utilisateurs

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/users` | Liste tous les utilisateurs |
| GET | `/api/users/:id` | Récupère un utilisateur |
| GET | `/api/users/:id/loans` | **Historique des emprunts d'un utilisateur** (en cours + retournés) |
| POST | `/api/users` | Crée un utilisateur (admin) |
| PUT | `/api/users/:id` | Met à jour un utilisateur (admin) |
| DELETE | `/api/users/:id` | Supprime un utilisateur (admin, refusé s'il a des emprunts en cours) |

### Authentification

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/login` | Connexion → `{ token, user }` |
| POST | `/api/auth/register` | Inscription → `{ token, user }` |
| GET | `/api/auth/profile` | Profil de l'utilisateur connecté |
| PUT | `/api/auth/profile` | Met à jour le profil (persisté en base) |
| PUT | `/api/auth/profile/password` | Change le mot de passe (`currentPassword` + `password`) |

### Divers

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api` | Index des endpoints |
| GET | `/api/health` | Santé du serveur |
| GET | `/api/stats` | Statistiques du tableau de bord |

## Modèles de données

### Book
```json
{
  "id": "book-xxx",
  "title": "Le Petit Prince",
  "author": "Antoine de Saint-Exupéry",
  "category": "Roman",
  "status": "Disponible",
  "date": "2025-04-01",
  "cover": "✦",
  "coverImage": "/covers/cover_xxx.jpg"
}
```

### Loan
```json
{
  "id": "loan-xxx",
  "bookId": "book-xxx",
  "userId": "user-xxx",
  "title": "Le Petit Prince",
  "author": "Antoine de Saint-Exupéry",
  "user": "Marie Dupont",
  "email": "marie@example.com",
  "start": "2026-09-15",
  "due": "2026-10-15",
  "returnedAt": null,
  "end": null,
  "status": "En cours"
}
```

### User
```json
{
  "id": "user-xxx",
  "name": "Marie Dupont",
  "email": "marie@example.com",
  "role": "Lecteur",
  "status": "Actif",
  "joinedAt": "2025-01-10"
}
```
Le champ `password` n'est **jamais** renvoyé par l'API ; il est stocké haché (bcrypt).

## Tests

```bash
npm test
```

34 tests (`test/api.test.js`) couvrent : santé de l'API, recherche par titre/auteur, CRUD des livres, création/retour d'emprunt avec date d'échéance, retards, historique par utilisateur, CRUD des utilisateurs, authentification (login, registration, profil persistant, changement de mot de passe), protections 401/403, statistiques et gestion des erreurs.

Les tests utilisent une base MongoDB dédiée `bibliotheque_test` (créée et supprimée automatiquement) : ils ne touchent pas à votre base de développement.

## Codes de retour HTTP

| Code | Signification |
|------|---------------|
| 200 | Succès |
| 201 | Créé avec succès |
| 400 | Données invalides |
| 401 | Non authentifié / identifiants incorrects |
| 403 | Accès refusé (rôle insuffisant) |
| 404 | Ressource non trouvée |
| 409 | Conflit (ex: livre déjà emprunté) |
| 500 | Erreur interne du serveur |