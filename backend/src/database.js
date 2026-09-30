import mongoose from 'mongoose';

/**
 * Connexion à MongoDB.
 * L'URI est lue depuis MONGODB_URI (voir .env.example).
 * En environnement de test, les tests fournissent leur propre URI
 * (mongodb-memory-server) AVANT d'importer ce module.
 */
// `retryWrites=false` : nécessaire pour un MongoDB standalone (sans replica set).
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bibliotheque?retryWrites=false';

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  mongoose.set('strictQuery', true);

  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    retryWrites: false,
  });

  console.log(`✓ Connecté à MongoDB : ${mongoose.connection.host}/${mongoose.connection.name}`);

  return mongoose.connection;
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

let _transactionsSupported;

/**
 * Vérifie si le déploiement MongoDB supporte les transactions
 * (nécessite un replica set ou mongos).
 * Le résultat est mis en cache après le premier appel.
 */
export async function supportsTransactions() {
  if (_transactionsSupported !== undefined) return _transactionsSupported;

  try {
    const admin = mongoose.connection.db.admin();
    const result = await admin.command({ hello: 1 });
    _transactionsSupported = result.setName != null || result.msg === 'isdbgrid';
  } catch {
    _transactionsSupported = false;
  }

  return _transactionsSupported;
}

export default mongoose;