import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    category: { type: String, default: 'Roman', trim: true },
    status: { type: String, enum: ['Disponible', 'Emprunté'], default: 'Disponible' },
    date: { type: String, default: () => new Date().toISOString().slice(0, 10) },
    cover: { type: String, default: '✦' },
    coverImage: { type: String, default: null },
  },
  { versionKey: false },
);

bookSchema.index({ title: 1 });
bookSchema.index({ author: 1 });
bookSchema.index({ status: 1 });

// Expose `id` au lieu de `_id`.
bookSchema.set('toJSON', {
  transform: (doc, ret) => ({
    id: ret._id,
    title: ret.title,
    author: ret.author,
    category: ret.category,
    status: ret.status,
    date: ret.date,
    cover: ret.cover,
    coverImage: ret.coverImage,
  }),
});

export default mongoose.model('Book', bookSchema);