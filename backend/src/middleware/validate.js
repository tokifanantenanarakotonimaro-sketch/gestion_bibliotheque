// Fonctions de validation réutilisables

export function validateBook(data) {
  const errors = [];

  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('Le titre est obligatoire');
  }

  if (!data.author || typeof data.author !== 'string' || data.author.trim().length === 0) {
    errors.push("L'auteur est obligatoire");
  }

  if (data.status && !['Disponible', 'Emprunté'].includes(data.status)) {
    errors.push("Le statut doit être 'Disponible' ou 'Emprunté'");
  }

  if (errors.length > 0) {
    const error = new Error(errors.join(', '));
    error.name = 'ValidationError';
    throw error;
  }

  return {
    title: data.title.trim(),
    author: data.author.trim(),
    category: data.category?.trim() || 'Roman',
    status: data.status || 'Disponible',
    coverImage: data.coverImage || null,
  };
}

export function validateLoan(data) {
  const errors = [];

  if (!data.bookId || typeof data.bookId !== 'string') {
    errors.push("L'ID du livre est obligatoire");
  }

  if (!data.userId || typeof data.userId !== 'string') {
    errors.push("L'ID de l'utilisateur est obligatoire");
  }

  if (!data.start || !isValidDate(data.start)) {
    errors.push("La date d'emprunt est obligatoire et doit être une date valide");
  }

  if (!data.due || !isValidDate(data.due)) {
    errors.push("La date d'échéance est obligatoire et doit être une date valide");
  }

  if (data.start && data.due && data.due < data.start) {
    errors.push("La date d'échéance doit être postérieure à la date d'emprunt");
  }

  if (errors.length > 0) {
    const error = new Error(errors.join(', '));
    error.name = 'ValidationError';
    throw error;
  }

  return {
    bookId: data.bookId,
    userId: data.userId,
    start: data.start,
    due: data.due,
  };
}

export function validateUser(data) {
  const errors = [];

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Le nom est obligatoire');
  }

  if (!data.email || typeof data.email !== 'string' || !isValidEmail(data.email)) {
    errors.push("L'adresse e-mail est obligatoire et doit être valide");
  }

  if (!data.password || typeof data.password !== 'string' || data.password.length < 6) {
    errors.push('Le mot de passe doit contenir au moins 6 caractères');
  }

  if (errors.length > 0) {
    const error = new Error(errors.join(', '));
    error.name = 'ValidationError';
    throw error;
  }

  return {
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    password: data.password,
  };
}

export function validateLogin(data) {
  const errors = [];

  if (!data.email || typeof data.email !== 'string' || !isValidEmail(data.email)) {
    errors.push("L'adresse e-mail est obligatoire et doit être valide");
  }

  if (!data.password || typeof data.password !== 'string') {
    errors.push('Le mot de passe est obligatoire');
  }

  if (errors.length > 0) {
    const error = new Error(errors.join(', '));
    error.name = 'ValidationError';
    throw error;
  }

  return {
    email: data.email.trim().toLowerCase(),
    password: data.password,
  };
}

// Helpers
function isValidDate(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}
