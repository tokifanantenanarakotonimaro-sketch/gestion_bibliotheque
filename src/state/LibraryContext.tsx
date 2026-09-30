import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { ApiError, api, getToken, setToken } from '../api/client';
import type { Book, LibraryUser, Loan, LoanHistoryItem } from '../types/library';

type BookInput = Pick<Book, 'title' | 'author' | 'category' | 'status' | 'coverImage'>;
type Profile = { name: string; email: string };

type LibraryContextValue = {
  books: Book[];
  loans: Loan[];
  history: LoanHistoryItem[];
  users: LibraryUser[];
  profile: Profile;
  authenticated: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addBook: (input: BookInput) => Promise<void>;
  updateBook: (id: string, input: BookInput) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;
  addLoan: (bookId: string, userId: string, start: string, due: string) => Promise<string | null>;
  returnLoan: (loanId: string) => Promise<void>;
  addUser: (name: string, email: string, password?: string) => Promise<string | null>;
  updateProfile: (profile: Profile) => Promise<string | null>;
  changePassword: (currentPassword: string, password: string) => Promise<string | null>;
  register: (name: string, email: string, password: string) => Promise<string | null>;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

const EMPTY_PROFILE: Profile = { name: 'Admin', email: '' };

/** Extrait le message lisible d'une erreur API. */
function messageOf(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Une erreur est survenue';
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [history, setHistory] = useState<LoanHistoryItem[]>([]);
  const [users, setUsers] = useState<LibraryUser[]>([]);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [authenticated, setAuthenticated] = useState(Boolean(getToken()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Chargement des données ---
  const loadBooks = useCallback(async () => {
    const data = await api<Book[]>('/api/books', { auth: false });
    setBooks(data);
  }, []);

  const loadPrivateData = useCallback(async () => {
    const [usersData, loansData, historyData, profileData] = await Promise.all([
      api<LibraryUser[]>('/api/users'),
      api<Loan[]>('/api/loans'),
      api<LoanHistoryItem[]>('/api/loans/history?scope=all'),
      api<Profile>('/api/auth/profile'),
    ]);
    setUsers(usersData);
    setLoans(loansData);
    setHistory(historyData);
    setProfile(profileData);
  }, []);

  const refresh = useCallback(async () => {
    await loadBooks();
    if (getToken()) await loadPrivateData();
  }, [loadBooks, loadPrivateData]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setLoading(true);
      setError(null);
      try {
        await loadBooks();
        if (getToken()) {
          try {
            await loadPrivateData();
            if (!cancelled) setAuthenticated(true);
          } catch (err) {
            // Session expirée : on nettoie silencieusement
            if (err instanceof ApiError && err.status === 401) {
              setToken(null);
              if (!cancelled) {
                setAuthenticated(false);
                setProfile(EMPTY_PROFILE);
              }
            } else {
              throw err;
            }
          }
        }
      } catch (err) {
        if (!cancelled) setError(messageOf(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    bootstrap();
    return () => { cancelled = true; };
  }, [loadBooks, loadPrivateData]);

  // --- Livres ---
  async function addBook(input: BookInput) {
    const created = await api<Book>('/api/books', { method: 'POST', body: input });
    setBooks(current => [created, ...current]);
  }

  async function updateBook(id: string, input: BookInput) {
    const updated = await api<Book>(`/api/books/${id}`, { method: 'PUT', body: input });
    setBooks(current => current.map(book => (book.id === id ? updated : book)));
  }

  async function deleteBook(id: string) {
    await api(`/api/books/${id}`, { method: 'DELETE' });
    setBooks(current => current.filter(book => book.id !== id));
  }

  // --- Emprunts ---
  async function addLoan(bookId: string, userId: string, start: string, due: string) {
    try {
      await api('/api/loans', { method: 'POST', body: { bookId, userId, start, due } });
      await refresh();
      return null;
    } catch (err) {
      return messageOf(err);
    }
  }

  async function returnLoan(loanId: string) {
    await api(`/api/loans/${loanId}/return`, { method: 'POST' });
    await refresh();
  }

  // --- Utilisateurs ---
  async function addUser(name: string, email: string, password = 'Lecteur123!') {
    try {
      await api('/api/users', { method: 'POST', body: { name, email, password } });
      const data = await api<LibraryUser[]>('/api/users');
      setUsers(data);
      return null;
    } catch (err) {
      return messageOf(err);
    }
  }

  // --- Profil ---
  async function updateProfile(next: Profile) {
    try {
      const updated = await api<Profile>('/api/auth/profile', { method: 'PUT', body: next });
      setProfile({ name: updated.name, email: updated.email });
      return null;
    } catch (err) {
      return messageOf(err);
    }
  }

  async function changePassword(currentPassword: string, password: string) {
    try {
      await api('/api/auth/profile/password', { method: 'PUT', body: { currentPassword, password } });
      return null;
    } catch (err) {
      return messageOf(err);
    }
  }

  // --- Authentification ---
  async function login(email: string, password: string) {
    try {
      const result = await api<{ token: string; user: LibraryUser }>(
        '/api/auth/login',
        { method: 'POST', body: { email, password }, auth: false },
      );
      setToken(result.token);
      setAuthenticated(true);
      setError(null);
      await refresh();
      return null;
    } catch (err) {
      return messageOf(err);
    }
  }

  async function register(name: string, email: string, password: string) {
    try {
      const result = await api<{ token: string; user: LibraryUser }>(
        '/api/auth/register',
        {
          method: 'POST',
          body: { name, email, password },
          auth: false,
        },
      );
      setToken(result.token);
      setAuthenticated(true);
      setError(null);
      await refresh();
      return null;
    } catch (err) {
      return messageOf(err);
    }
  }

  function logout() {
    setToken(null);
    setAuthenticated(false);
    setProfile(EMPTY_PROFILE);
    setUsers([]);
    setLoans([]);
    setHistory([]);
  }

  const value: LibraryContextValue = {
    books, loans, history, users, profile, authenticated, loading, error,
    refresh, addBook, updateBook, deleteBook, addLoan, returnLoan, addUser,
    updateProfile, changePassword, register, login, logout,
  };

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) throw new Error('useLibrary doit être utilisé dans LibraryProvider');
  return context;
}
