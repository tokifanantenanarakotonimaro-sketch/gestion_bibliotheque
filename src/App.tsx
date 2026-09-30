import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthPage } from './pages/AuthPage';
import { BooksPage } from './pages/BooksPage';
import { DashboardPage } from './pages/DashboardPage';
import { HistoryPage } from './pages/HistoryPage';
import { HomePage } from './pages/HomePage';
import { LoansPage } from './pages/LoansPage';
import { ProfilePage } from './pages/ProfilePage';
import { SearchPage } from './pages/SearchPage';
import { UsersPage } from './pages/UsersPage';
import { LibraryProvider, useLibrary } from './state/LibraryContext';
import { ToastProvider } from './state/ToastContext';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { authenticated } = useLibrary();
  return authenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  return <ToastProvider><LibraryProvider><BrowserRouter><Routes><Route path="/" element={<HomePage />} /><Route path="/login" element={<AuthPage mode="login" />} /><Route path="/register" element={<AuthPage mode="register" />} /><Route path="/admin" element={<PrivateRoute><DashboardPage /></PrivateRoute>} /><Route path="/admin/users" element={<PrivateRoute><UsersPage /></PrivateRoute>} /><Route path="/admin/books" element={<PrivateRoute><BooksPage /></PrivateRoute>} /><Route path="/admin/loans" element={<PrivateRoute><LoansPage /></PrivateRoute>} /><Route path="/admin/history" element={<PrivateRoute><HistoryPage /></PrivateRoute>} /><Route path="/admin/search" element={<PrivateRoute><SearchPage /></PrivateRoute>} /><Route path="/admin/settings" element={<PrivateRoute><ProfilePage /></PrivateRoute>} /><Route path="*" element={<HomePage />} /></Routes></BrowserRouter></LibraryProvider></ToastProvider>;
}

export default App;
