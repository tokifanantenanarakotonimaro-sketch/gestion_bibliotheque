import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

// --- Environnement de test : base MongoDB dédiée + secret dédié ---
// Doit être défini AVANT l'import de src/database.js (qui lit l'env au chargement).
process.env.MONGODB_URI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/bibliotheque_test?retryWrites=false';
process.env.JWT_SECRET = 'secret-de-test';
process.env.NODE_ENV = 'test';
delete process.env.PORT;

const { createApp } = await import('../src/server.js');
const { migrate } = await import('../src/migrate.js');
const { seed } = await import('../src/seed.js');
const { connectDB, disconnectDB } = await import('../src/database.js');

let server;
let baseUrl;
let tokenAdmin;
let tokenLecteur;

function request(method, path, { token, body } = {}) {
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  }).then(async res => {
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    return { status: res.status, data };
  });
}

before(async () => {
  // Base de test propre
  await connectDB();
  await mongoose.connection.dropDatabase();

  await migrate();
  await seed();

  const app = createApp();
  await new Promise(resolve => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  // Connexion de l'administrateur
  const admin = await request('POST', '/api/auth/login', {
    body: { email: 'admin@bibliotheque.com', password: 'admin123' },
  });
  assert.equal(admin.status, 200, 'Le seed doit créer un administrateur fonctionnel');
  tokenAdmin = admin.data.token;

  // Connexion d'un simple lecteur
  const lecteur = await request('POST', '/api/auth/login', {
    body: { email: 'marie.dupont@example.com', password: 'Lecteur123!' },
  });
  assert.equal(lecteur.status, 200);
  tokenLecteur = lecteur.data.token;
});

after(async () => {
  server?.close();
  await mongoose.connection.dropDatabase();
  await disconnectDB();
});

// ---------------------------------------------------------------------------
// 1. API disponible
// ---------------------------------------------------------------------------
test('GET /api/health répond 200', async () => {
  const res = await request('GET', '/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.data.status, 'ok');
});

test('GET /api liste les endpoints', async () => {
  const res = await request('GET', '/api');
  assert.equal(res.status, 200);
  assert.ok(res.data.endpoints.livres);
});

// ---------------------------------------------------------------------------
// 2. Recherche de livres par titre / auteur
// ---------------------------------------------------------------------------
test('Le catalogue est public en lecture', async () => {
  const res = await request('GET', '/api/books');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.data));
  assert.ok(res.data.length >= 5);
});

test('Recherche par titre', async () => {
  const res = await request('GET', '/api/books?search=1984');
  assert.equal(res.status, 200);
  assert.equal(res.data.length, 1);
  assert.equal(res.data[0].title, '1984');
});

test("Recherche par auteur", async () => {
  const res = await request('GET', '/api/books?search=hugo');
  assert.equal(res.status, 200);
  assert.ok(res.data.some(b => b.author === 'Victor Hugo'));
});

test('Recherche sans résultat renvoie un tableau vide', async () => {
  const res = await request('GET', '/api/books?search=zzzzinexistant');
  assert.equal(res.status, 200);
  assert.deepEqual(res.data, []);
});

// ---------------------------------------------------------------------------
// 3. CRUD des livres
// ---------------------------------------------------------------------------
test("POST /api/books refuse l'accès sans token", async () => {
  const res = await request('POST', '/api/books', { body: { title: 'X', author: 'Y' } });
  assert.equal(res.status, 401);
});

test("POST /api/books accepte tout utilisateur connecté", async () => {
  const res = await request('POST', '/api/books', {
    token: tokenLecteur,
    body: { title: 'X', author: 'Y' },
  });
  assert.equal(res.status, 201);
});

test('CRUD complet des livres', async () => {
  // CREATE
  const created = await request('POST', '/api/books', {
    token: tokenAdmin,
    body: { title: 'Le Comte de Monte-Cristo', author: 'Alexandre Dumas', category: 'Classique' },
  });
  assert.equal(created.status, 201);
  assert.equal(created.data.status, 'Disponible');
  const id = created.data.id;

  // READ
  const read = await request('GET', `/api/books/${id}`);
  assert.equal(read.status, 200);
  assert.equal(read.data.title, 'Le Comte de Monte-Cristo');

  // UPDATE
  const updated = await request('PUT', `/api/books/${id}`, {
    token: tokenAdmin,
    body: { title: 'Le Comte de Monte-Cristo', author: 'Alexandre Dumas', category: 'Aventure' },
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.data.category, 'Aventure');

  // DELETE
  const deleted = await request('DELETE', `/api/books/${id}`, { token: tokenAdmin });
  assert.equal(deleted.status, 200);

  const gone = await request('GET', `/api/books/${id}`);
  assert.equal(gone.status, 404);
});

test('La validation refuse un livre sans titre', async () => {
  const res = await request('POST', '/api/books', {
    token: tokenAdmin,
    body: { title: '', author: '' },
  });
  assert.equal(res.status, 400);
});

// ---------------------------------------------------------------------------
// 4. Emprunt et retour avec date d'échéance
// ---------------------------------------------------------------------------
test("POST /api/loans crée un emprunt et passe le livre en 'Emprunté'", async () => {
  const start = '2026-09-29';
  const due = '2026-10-29';

  const res = await request('POST', '/api/loans', {
    token: tokenAdmin,
    body: { bookId: 'book-5', userId: 'user-lucas', start, due },
  });

  assert.equal(res.status, 201, JSON.stringify(res.data));
  assert.equal(res.data.start, start);
  assert.equal(res.data.due, due);
  assert.equal(res.data.status, 'En cours');
  assert.equal(res.data.user, 'Lucas Moreau');

  const book = await request('GET', '/api/books/book-5');
  assert.equal(book.data.status, 'Emprunté');

  // Mémoriser pour le test de retour
  test.createdLoanId = res.data.id;
});

test('Un livre déjà emprunté ne peut pas être ré-emprunté (409)', async () => {
  const res = await request('POST', '/api/loans', {
    token: tokenAdmin,
    body: { bookId: 'book-5', userId: 'user-jean', start: '2026-09-29', due: '2026-10-29' },
  });
  assert.equal(res.status, 409);
});

test("La date d'échéance doit suivre la date d'emprunt", async () => {
  const res = await request('POST', '/api/loans', {
    token: tokenAdmin,
    body: { bookId: 'book-5', userId: 'user-jean', start: '2026-10-10', due: '2026-10-01' },
  });
  assert.equal(res.status, 400);
});

test('Un emprunt avec une échéance passée est marqué « En retard »', async () => {
  // On crée un livre dédié pour ne pas dépendre de l'état des autres tests
  const book = await request('POST', '/api/books', {
    token: tokenAdmin,
    body: { title: 'Livre en retard', author: 'Auteur Test' },
  });
  assert.equal(book.status, 201);

  const res = await request('POST', '/api/loans', {
    token: tokenAdmin,
    body: { bookId: book.data.id, userId: 'user-jean', start: '2026-01-01', due: '2026-01-15' },
  });
  assert.equal(res.status, 201, JSON.stringify(res.data));
  assert.equal(res.data.status, 'En retard');

  // Il apparaît dans la liste des retards
  const overdue = await request('GET', '/api/loans/overdue', { token: tokenAdmin });
  assert.equal(overdue.status, 200);
  assert.ok(overdue.data.some(l => l.id === res.data.id));
});

test("POST /api/loans/:id/return retourne l'emprunt et libère le livre", async () => {
  const loanId = test.createdLoanId;
  assert.ok(loanId, "L'emprunt du test précédent doit exister");

  const res = await request('POST', `/api/loans/${loanId}/return`, { token: tokenAdmin });
  assert.equal(res.status, 200, JSON.stringify(res.data));
  assert.equal(res.data.status, 'Retourné');
  assert.ok(res.data.returnedAt, 'La date de retour doit être renseignée');

  const book = await request('GET', '/api/books/book-5');
  assert.equal(book.data.status, 'Disponible');

  // Deuxième retour → conflit
  const again = await request('POST', `/api/loans/${loanId}/return`, { token: tokenAdmin });
  assert.equal(again.status, 409);
});

test('Un retour inexistant renvoie 404', async () => {
  const res = await request('POST', '/api/loans/loan-inexistant/return', { token: tokenAdmin });
  assert.equal(res.status, 404);
});

test('Les routes de loans sont protégées', async () => {
  assert.equal((await request('GET', '/api/loans')).status, 401);
  assert.equal((await request('GET', '/api/loans/history')).status, 401);
  assert.equal((await request('GET', '/api/loans', { token: tokenAdmin })).status, 200);
});

// ---------------------------------------------------------------------------
// 5. Historique des emprunts par utilisateur
// ---------------------------------------------------------------------------
test('GET /api/loans ne renvoie que les emprunts en cours', async () => {
  const res = await request('GET', '/api/loans', { token: tokenAdmin });
  assert.equal(res.status, 200);
  assert.ok(res.data.length > 0);
  assert.ok(res.data.every(l => l.status !== 'Retourné'));
});

test('GET /api/loans?userId= filtre par utilisateur', async () => {
  const res = await request('GET', '/api/loans?userId=user-sophie', { token: tokenAdmin });
  assert.equal(res.status, 200);
  assert.ok(res.data.length > 0);
  assert.ok(res.data.every(l => l.userId === 'user-sophie'));
});

test('GET /api/loans/history renvoie les emprunts retournés', async () => {
  const res = await request('GET', '/api/loans/history', { token: tokenAdmin });
  assert.equal(res.status, 200);
  assert.ok(res.data.length > 0);
  assert.ok(res.data.every(l => l.status === 'Retourné'));
  assert.ok(res.data.every(l => l.returnedAt));
});

test('GET /api/loans/history?userId= filtre aussi par utilisateur', async () => {
  const res = await request('GET', '/api/loans/history?userId=user-jean', { token: tokenAdmin });
  assert.equal(res.status, 200);
  assert.ok(res.data.length > 0);
  assert.ok(res.data.every(l => l.userId === 'user-jean'));
});

test('GET /api/loans/history?scope=all renvoie l\'historique complet', async () => {
  const res = await request('GET', '/api/loans/history?scope=all', { token: tokenAdmin });
  assert.equal(res.status, 200);
  const statuses = new Set(res.data.map(l => l.status));
  assert.ok(statuses.has('Retourné'));
  assert.ok(statuses.has('En cours') || statuses.has('En retard'));
});

test("GET /api/users/:id/loans renvoie l'historique complet d'un utilisateur", async () => {
  const res = await request('GET', '/api/users/user-marie/loans', { token: tokenAdmin });
  assert.equal(res.status, 200);
  assert.ok(res.data.length > 0);
  assert.ok(res.data.every(l => l.userId === 'user-marie'));
  assert.ok(res.data.some(l => l.status === 'Retourné'));
});

test("GET /api/loans/overdue ne renvoie que les retards", async () => {
  const res = await request('GET', '/api/loans/overdue', { token: tokenAdmin });
  assert.equal(res.status, 200);
  assert.ok(res.data.every(l => l.status === 'En retard'));
});

// ---------------------------------------------------------------------------
// 6. Utilisateurs
// ---------------------------------------------------------------------------
test('CRUD des utilisateurs', async () => {
  const created = await request('POST', '/api/users', {
    token: tokenAdmin,
    body: { name: 'Utilisateur Test', email: 'utilisateur.test@example.com', password: 'Secret123' },
  });
  assert.equal(created.status, 201);
  assert.equal(created.data.password, undefined, 'Le mot de passe ne doit jamais être renvoyé');
  const id = created.data.id;

  // Email dupliqué
  const duplicate = await request('POST', '/api/users', {
    token: tokenAdmin,
    body: { name: 'Doublon', email: 'utilisateur.test@example.com', password: 'Secret123' },
  });
  assert.equal(duplicate.status, 409);

  const updated = await request('PUT', `/api/users/${id}`, {
    token: tokenAdmin,
    body: { name: 'Utilisateur Modifié', status: 'Inactif' },
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.data.name, 'Utilisateur Modifié');
  assert.equal(updated.data.status, 'Inactif');

  const deleted = await request('DELETE', `/api/users/${id}`, { token: tokenAdmin });
  assert.equal(deleted.status, 200);
});

test('Les routes utilisateurs sont protégées', async () => {
  assert.equal((await request('GET', '/api/users')).status, 401);
  assert.equal((await request('GET', '/api/users', { token: tokenLecteur })).status, 200);
  assert.equal((await request('POST', '/api/users', { token: tokenLecteur, body: {} })).status, 400);
});

// ---------------------------------------------------------------------------
// 7. Authentification
// ---------------------------------------------------------------------------
test('Un mauvais mot de passe est refusé', async () => {
  const res = await request('POST', '/api/auth/login', {
    body: { email: 'admin@bibliotheque.com', password: 'mauvais' },
  });
  assert.equal(res.status, 401);
});

test('Le profil est refusé sans token', async () => {
  assert.equal((await request('GET', '/api/auth/profile')).status, 401);
  assert.equal((await request('GET', '/api/auth/profile', { token: 'token-faux' })).status, 401);
});

test('Le profil est persisté (et plus codé en dur)', async () => {
  const before = await request('GET', '/api/auth/profile', { token: tokenAdmin });
  assert.equal(before.status, 200);
  assert.equal(before.data.email, 'admin@bibliotheque.com');

  const updated = await request('PUT', '/api/auth/profile', {
    token: tokenAdmin,
    body: { name: 'Admin Renommé', email: 'admin2@bibliotheque.com' },
  });
  assert.equal(updated.status, 200);

  const after = await request('GET', '/api/auth/profile', { token: tokenAdmin });
  assert.equal(after.data.name, 'Admin Renommé');
  assert.equal(after.data.email, 'admin2@bibliotheque.com');

  // On remet en place pour les autres tests
  await request('PUT', '/api/auth/profile', {
    token: tokenAdmin,
    body: { name: 'Admin', email: 'admin@bibliotheque.com' },
  });
});

test('Le changement de mot de passe vérifie le mot de passe actuel', async () => {
  const bad = await request('PUT', '/api/auth/profile/password', {
    token: tokenAdmin,
    body: { currentPassword: 'faux', password: 'Nouveau123' },
  });
  assert.equal(bad.status, 401);

  const ok = await request('PUT', '/api/auth/profile/password', {
    token: tokenAdmin,
    body: { currentPassword: 'admin123', password: 'Nouveau123' },
  });
  assert.equal(ok.status, 200);

  // Connexion avec l'ancien mot de passe → refusée
  const oldLogin = await request('POST', '/api/auth/login', {
    body: { email: 'admin@bibliotheque.com', password: 'admin123' },
  });
  assert.equal(oldLogin.status, 401);

  // Connexion avec le nouveau → acceptée
  const newLogin = await request('POST', '/api/auth/login', {
    body: { email: 'admin@bibliotheque.com', password: 'Nouveau123' },
  });
  assert.equal(newLogin.status, 200);
  tokenAdmin = newLogin.data.token;

  // On restaure le mot de passe initial
  await request('PUT', '/api/auth/profile/password', {
    token: tokenAdmin,
    body: { currentPassword: 'Nouveau123', password: 'admin123' },
  });
  const restored = await request('POST', '/api/auth/login', {
    body: { email: 'admin@bibliotheque.com', password: 'admin123' },
  });
  assert.equal(restored.status, 200);
  tokenAdmin = restored.data.token;
});

test("L'inscription crée un compte et permet de se connecter", async () => {
  const registered = await request('POST', '/api/auth/register', {
    body: { name: 'Nouveau Lecteur', email: 'nouveau.lecteur@example.com', password: 'Secret123' },
  });
  assert.equal(registered.status, 201);
  assert.ok(registered.data.token);
  assert.equal(registered.data.user.password, undefined);

  const login = await request('POST', '/api/auth/login', {
    body: { email: 'nouveau.lecteur@example.com', password: 'Secret123' },
  });
  assert.equal(login.status, 200);

  const again = await request('POST', '/api/auth/register', {
    body: { name: 'Doublon', email: 'nouveau.lecteur@example.com', password: 'Secret123' },
  });
  assert.equal(again.status, 409);
});

// ---------------------------------------------------------------------------
// 8. Statistiques
// ---------------------------------------------------------------------------
test('GET /api/stats renvoie les compteurs', async () => {
  assert.equal((await request('GET', '/api/stats')).status, 401);

  const res = await request('GET', '/api/stats', { token: tokenAdmin });
  assert.equal(res.status, 200);
  assert.ok(res.data.books >= 5);
  assert.ok(res.data.users >= 5);
  assert.equal(
    res.data.booksAvailable + res.data.booksBorrowed,
    res.data.books,
    'Chaque livre est soit disponible, soit emprunté',
  );
});

test('Les erreurs JSON malformés renvoient 400', async () => {
  const res = await fetch(`${baseUrl}/api/books`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAdmin}` },
    body: '{pas du json',
  });
  assert.equal(res.status, 400);
});

test('Une route inexistante renvoie 404', async () => {
  const res = await request('GET', '/api/inexistant');
  assert.equal(res.status, 404);
});