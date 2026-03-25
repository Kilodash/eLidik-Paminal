import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth-context';
import { Toaster } from './components/ui/sonner';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DumasListPage from './pages/DumasListPage';
import DumasCreatePage from './pages/DumasCreatePage';
import DumasDetailPage from './pages/DumasDetailPage';
import ApprovalInboxPage from './pages/ApprovalInboxPage';
import SettingsPage from './pages/SettingsPage';
import ArchivePage from './pages/ArchivePage';
import './App.css';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 border-4 border-blue-800 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="h-8 w-8 border-4 border-blue-800 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/dumas" element={<ProtectedRoute><DumasListPage /></ProtectedRoute>} />
      <Route path="/dumas/create" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><DumasCreatePage /></ProtectedRoute>} />
      <Route path="/dumas/:dumasId" element={<ProtectedRoute><DumasDetailPage /></ProtectedRoute>} />
      <Route path="/approval" element={<ProtectedRoute allowedRoles={['pimpinan', 'superadmin']}><ApprovalInboxPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute allowedRoles={['superadmin']}><SettingsPage /></ProtectedRoute>} />
      <Route path="/archive" element={<ProtectedRoute allowedRoles={['superadmin']}><ArchivePage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
