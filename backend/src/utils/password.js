import bcrypt from 'bcryptjs';

const ROUNDS = 10;

/** Indique si une valeur est déjà hachée en bcrypt. */
export function isHashed(value) {
  return typeof value === 'string' && /^\$2[aby]\$/.test(value);
}

/** Hache un mot de passe en clair avec bcrypt. */
export async function hashPassword(plain) {
  return bcrypt.hash(String(plain), ROUNDS);
}

/**
 * Vérifie un mot de passe contre son hash.
 * Gère aussi les anciens mots de passe encore stockés en clair (avant la
 * migration) pour ne bloquer personne si celle-ci n'a pas encore tourné.
 */
export async function verifyPassword(plain, stored) {
  if (!stored) return false;

  if (isHashed(stored)) {
    return bcrypt.compare(String(plain), stored);
  }

  // Ancien format en clair : comparaison à temps constant.
  const a = Buffer.from(String(plain), 'utf8');
  const b = Buffer.from(String(stored), 'utf8');
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
