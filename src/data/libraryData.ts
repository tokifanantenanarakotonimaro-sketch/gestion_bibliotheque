import type { Book, Loan, LoanHistoryItem } from '../types/library';

export const books: Book[] = [
  { title: 'Le Petit Prince', author: 'Antoine de Saint-Exupéry', category: 'Roman', status: 'Disponible', date: '2025-04-01', cover: '✦', coverImage: '/covers/cover_petit_prince_1790315060574.jpg' },
  { title: '1984', author: 'George Orwell', category: 'Science-fiction', status: 'Disponible', date: '2025-03-28', cover: '▦', coverImage: '/covers/cover_1984_orwell_1790315074791.jpg' },
  { title: 'Dune', author: 'Frank Herbert', category: 'Science-fiction', status: 'Disponible', date: '2025-03-25', cover: '◒', coverImage: '/covers/cover_dune_herbert_1790315089578.jpg' },
  { title: 'Les Misérables', author: 'Victor Hugo', category: 'Classique', status: 'Disponible', date: '2025-03-20', cover: '▤', coverImage: '/covers/cover_les_miserables_1790315103463.jpg' },
  { title: "L'Étranger", author: 'Albert Camus', category: 'Philosophie', status: 'Emprunté', date: '2025-03-18', cover: '◈', coverImage: '/covers/cover_etranger_camus_1790315117186.jpg' },
];

export const loans: Loan[] = [
  { title: 'Le Petit Prince', user: 'Marie Dupont', start: '2025-04-01', due: '2025-04-15', status: 'En cours' },
  { title: '1984', user: 'Jean Martin', start: '2025-03-28', due: '2025-04-11', status: 'En cours' },
  { title: 'Dune', user: 'Sophie Bernard', start: '2025-03-25', due: '2025-04-08', status: 'En cours' },
  { title: 'Les Misérables', user: 'Lucas Moreau', start: '2025-03-20', due: '2025-04-03', status: 'En cours' },
];

export const history: LoanHistoryItem[] = [
  { title: 'Le Petit Prince', author: 'Antoine de Saint-Exupéry', start: '2025-03-01', end: '2025-03-15', status: 'Retourné' },
  { title: '1984', author: 'George Orwell', start: '2025-02-20', end: '2025-03-05', status: 'Retourné' },
  { title: 'Dune', author: 'Frank Herbert', start: '2025-02-05', end: '2025-02-19', status: 'Retourné' },
  { title: 'Les Misérables', author: 'Victor Hugo', start: '2024-12-10', end: '2024-12-19', status: 'Retourné' },
];
