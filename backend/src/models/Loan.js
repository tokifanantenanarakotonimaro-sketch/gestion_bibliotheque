import mongoose from 'mongoose';

const loanSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    bookId: { type: String, ref: 'Book', required: true },
    userId: { type: String, ref: 'User', required: true },
    start: { type: String, required: true },
    due: { type: String, required: true },
    returnedAt: { type: String, default: null },
    status: {
      type: String,
      enum: ['En cours', 'En retard', 'Retourné'],
      default: 'En cours',
    },
  },
  { versionKey: false },
);

loanSchema.index({ userId: 1 });
loanSchema.index({ bookId: 1 });
loanSchema.index({ status: 1 });

export default mongoose.model('Loan', loanSchema);