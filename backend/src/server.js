import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

import booksRouter from './routes/books.js';
import loansRouter from './routes/loans.js';
import usersRouter from './routes/users.js';
import authRouter from './routes/auth.js';
import statsRouter from './routes/stats.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { requireAuth } from './middleware/auth.js';
import { migrate } from './migrate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Construit l'application Express.
 * Exposée pour les tests : ils peuvent créer une instance sur un port libre.
 */
export function createApp() {
  const app = express();

  // Middleware
  app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
    credentials: true,
  }));
  app.use(express.json({ limit: '2mb' }));

  // Index de l'API
  app.get('/api', (req, res) => {
    res.json({
      name: 'API Système de Gestion de Bibliothèque',
      version: '1.0.0',
      endpoints: {
        livres: {
          'GET /api/books': 'Liste des livres (?search, ?category, ?status)',
          'GET /api/books/categories': 'Liste des catégories',
          'GET /api/books/:id': 'Un livre',
          'POST /api/books': 'Créer un livre (admin)',
          'PUT /api/books/:id': 'Modifier un livre (admin)',
          'DELETE /api/books/:id': 'Supprimer un livre (admin)',
        },
        emprunts: {
          'GET /api/loans': 'Emprunts en cours (?userId, ?bookId, ?overdue)',
          'GET /api/loans/history': 'Historique (?userId, ?scope=returned|active|all)',
          'GET /api/loans/overdue': 'Emprunts en retard',
          'GET /api/loans/:id': 'Un emprunt',
          'POST /api/loans': 'Créer un emprunt (admin)',
          'POST /api/loans/:id/return': 'Retourner un emprunt (admin)',
        },
        utilisateurs: {
          'GET /api/users': 'Liste des utilisateurs',
          'GET /api/users/:id/loans': 'Historique des emprunts d\'un utilisateur',
          'POST /api/users': 'Créer un utilisateur (admin)',
          'PUT /api/users/:id': 'Modifier un utilisateur (admin)',
          'DELETE /api/users/:id': 'Supprimer un utilisateur (admin)',
        },
        authentification: {
          'POST /api/auth/login': 'Connexion → { token, user }',
          'POST /api/auth/register': 'Inscription → { token, user }',
          'GET /api/auth/profile': 'Profil de l\'utilisateur connecté',
          'PUT /api/auth/profile': 'Mettre à jour le profil',
          'PUT /api/auth/profile/password': 'Changer le mot de passe',
        },
        divers: {
          'GET /api/health': 'Santé du serveur',
          'GET /api/stats': 'Statistiques du tableau de bord',
        },
      },
    });
  });

  // Route de santé (publique)
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Routes API
  app.use('/api/books', booksRouter);   // GET public, écritures protégées
  app.use('/api/loans', loansRouter);   // entièrement protégé
  app.use('/api/users', usersRouter);   // entièrement protégé
  app.use('/api/auth', authRouter);     // login/register publics
  app.use('/api/stats', requireAuth, statsRouter);

  // Gestion des erreurs
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

const isMainModule = process.argv[1]
  && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isMainModule) {
  // Refuser de démarrer sans secret en production
  if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    console.error('ERREUR : JWT_SECRET doit être défini dans .env en production.');
    process.exit(1);
  }

  // Connexion MongoDB + migration du schéma avant d'accepter les requêtes
  migrate()
    .then(() => {
      const app = createApp();
      const PORT = process.env.PORT || 3001;

      app.listen(PORT, () => {
        console.log(`Serveur démarré sur http://localhost:${PORT}`);
        console.log(`API disponible sur http://localhost:${PORT}/api`);
      });
    })
    .catch(err => {
      console.error('Erreur au démarrage :', err);
      process.exit(1);
    });
}