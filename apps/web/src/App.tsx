/**
 * Root application component for Sage Codex
 *
 * Sets up routing with authentication:
 * - /login route for unauthenticated users
 * - / route shows session picker (start new / resume existing)
 * - /design-system route for design system verification
 * - AuthProvider wraps the entire app for auth state
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AuthPage } from '@/pages/AuthPage';
import { SessionPage } from '@/pages/SessionPage';
import { DesignSystem } from '@/pages/DesignSystem';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<AuthPage />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <SessionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/design-system"
            element={
              <ProtectedRoute>
                <DesignSystem />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
