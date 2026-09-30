# Bibliothèque

Application web complète de gestion de bibliothèque : un **frontend React** et une **API REST Node.js/Express** avec base de données SQLite, authentification JWT et mots de passe hachés.

Elle permet de consulter le catalogue, gérer les livres, enregistrer les emprunts et les retours avec date d'échéance, consulter l'historique par utilisateur, rechercher par titre/auteur et gérer les comptes.

## Technologies

**Frontend**

- React 18 et TypeScript
- Vite
- React Router
- Lucide React
- ESLint

**Backend** (`backend/`)

- Node.js et Express
- SQLite via `sql.js`
- Authentification JWT (`jsonwebtoken`)
- Mots de passe hachés avec `bcryptjs`
- Tests avec le module `node:test`

## Démarrage

### 1. Le backend (obligatoire)

```bash
cd backend
npm install

# Créer les tables + hacher les mots de passe
npm run migrate

# Créer les comptes initiaux (une seule fois)
npm run seed

# Démarrer l'API sur http://localhost:3001
npm run dev
```

**Compte administrateur :** `admin@bibliotheque.com` / `admin123`

### 2. Le frontend

```bash
# À la racine du projet
npm install
npm run dev
```

Ouvrez ensuite `http://localhost:5173`.

> Le frontend appelle l'API sur `http://localhost:3001`. Pour changer d'adresse,
> définissez la variable `VITE_API_URL` (fichier `.env` à la racine) :
> ```
> VITE_API_URL=http://localhost:3001
> ```

## Vérifications

```bash
# Frontend
npm run typecheck
npm run lint
npm run build

# Backend
cd backend
npm test        # 34 tests : CRUD, emprunts, retours, historique, recherche, auth...
```

## Fonctionnalités

| Fonctionnalité | Endpoint |
|---|---|
| CRUD des livres (titre, auteur, catégorie, disponibilité) | `GET/POST/PUT/DELETE /api/books` |
| Emprunt avec date d'échéance | `POST /api/loans` |
| Retour d'un emprunt | `POST /api/loans/:id/return` |
| Historique des emprunts par utilisateur | `GET /api/users/:id/loans`, `GET /api/loans/history?userId=` |
| Recherche de livres par titre/auteur | `GET /api/books?search=` |
| Gestion des utilisateurs | `GET/POST/PUT/DELETE /api/users` |
| Connexion / inscription / profil | `/api/auth/*` |
| Statistiques du tableau de bord | `GET /api/stats` |

La liste complète des endpoints est disponible sur `http://localhost:3001/api`.

### Sécurité

- Catalogue public en lecture, écritures réservées aux administrateurs
- Routes `/api/loans`, `/api/users`, `/api/stats` protégées par token JWT
- Mots de passe hachés (bcrypt), jamais renvoyés par l'API
- Le changement de mot de passe exige le mot de passe actuel
- Les formulaires de connexion et d'inscription sont protégés contre
  l'écriture automatique (autofill) du navigateur

## Structure principale

```text
src/
├── api/          # Client HTTP vers le backend
├── components/   # Composants réutilisables et mise en page
├── pages/        # Pages publiques et pages d'administration
├── state/        # Contextes (données de la bibliothèque, toasts)
├── types/        # Types métier
├── App.tsx       # Déclaration des routes
└── main.tsx      # Point d'entrée React

backend/
├── src/
│   ├── routes/       # Routes Express (books, loans, users, auth, stats)
│   ├── middleware/   # Authentification, validation, gestion d'erreurs
│   ├── utils/        # Mot de passe, tokens, statuts d'emprunt
│   ├── server.js     # Construction de l'application
│   ├── database.js   # Accès SQLite + transactions
│   ├── migrate.js    # Création et migration du schéma
│   └── seed.js       # Données initiales
├── test/           # Tests automatisés
└── data/           # Fichier SQLite
```

> `src/data/libraryData.ts` est l'ancien jeu de données de démonstration,
> conservé pour référence : l'application utilise maintenant l'API.
