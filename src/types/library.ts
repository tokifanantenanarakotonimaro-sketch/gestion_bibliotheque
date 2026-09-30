export type BookStatus = 'Disponible' | 'Emprunté';
export type LoanStatus = 'En cours' | 'En retard' | 'Retourné';

export interface Book {
  id?: string;
  title: string;
  author: string;
  category: string;
  status: BookStatus;
  date: string;
  cover: string;
  coverImage?: string;
}

export interface Loan {
  id?: string;
  title: string;
  user: string;
  userId?: string;
  start: string;
  due: string;
  status: LoanStatus;
  returnedAt?: string;
}

export interface LoanHistoryItem {
  id?: string;
  title: string;
  author: string;
  user?: string;
  userId?: string;
  start: string;
  end: string;
  status: LoanStatus;
}

export interface LibraryUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'Administrateur' | 'Lecteur';
  status: 'Actif' | 'Inactif';
  joinedAt: string;
}
