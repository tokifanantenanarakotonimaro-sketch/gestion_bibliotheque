import { verifyToken } from '../utils/token.js';

/**
 * Enveloppe un handler async pour propager les promesses rejetées
 * vers le middleware errorHandler (Express 4 ne le fait pas tout seul).
 */
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

/** Extrait le token du header `Authorization: Bearer <token>`. */
function extractToken(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

/**
 * Middleware d'authentification : vérifie le token JWT et attache
 * les informations de l'utilisateur à `req.user`.
 */
export function requireAuth(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ error: 'Authentification requise' });
  }

  try {
    const payload = verifyToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      name: payload.name,
    };
    return next();
  } catch (err) {
    return res.status(401).json({
      error: 'Session invalide ou expirée',
      details: err.message,
    });
  }
}

/**
 * Middleware d'autorisation : nécessite d'abord l'authentification,
 * puis le rôle Administrateur. Il s'authentifie lui-même pour éviter
 * d'oublier `requireAuth` sur une route.
 */
export function requireAdmin(req, res, next) {
  return requireAuth(req, res, () => {
    // Si l'authentification a échoué, requireAuth a déjà répondu (401)
    // et ce callback n'est pas appelé.
    if (res.headersSent) return;

    if (req.user.role !== 'Administrateur') {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    }
    return next();
  });
}
