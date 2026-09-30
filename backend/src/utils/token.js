import jwt from 'jsonwebtoken';

// Secret de signature des tokens. En production, JWT_SECRET doit être défini
// dans .env — sinon on refuse de démarrer (voir server.js).
// Exporté : il sert aussi à hacher les codes de réinitialisation de mot de passe.
export const SECRET = process.env.JWT_SECRET || 'bibliotheque-dev-secret-change-me';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Signe un token d'accès.
 * @param {{ id: string, email: string, role: string }} user
 * @returns {string}
 */
export function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.name },
    SECRET,
    { expiresIn: EXPIRES_IN },
  );
}

/**
 * Vérifie un token et renvoie son contenu.
 * Lance une erreur si le token est invalide ou expiré.
 * @param {string} token
 * @returns {object}
 */
export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

/** Durée de vie du token, exposée au client. */
export const TOKEN_EXPIRES_IN = EXPIRES_IN;
