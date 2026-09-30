import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['Administrateur', 'Lecteur'], default: 'Lecteur' },
    status: { type: String, enum: ['Actif', 'Inactif'], default: 'Actif' },
    joinedAt: { type: String, default: () => new Date().toISOString().slice(0, 10) },
  },
  { versionKey: false },
);

// Expose `id` au lieu de `_id` et ne renvoie JAMAIS le mot de passe.
userSchema.set('toJSON', {
  transform: (doc, ret) => ({
    id: ret._id,
    name: ret.name,
    email: ret.email,
    role: ret.role,
    status: ret.status,
    joinedAt: ret.joinedAt,
  }),
});

export default mongoose.model('User', userSchema);