/**
 * Root application component for Sage Codex
 *
 * Sets up routing with authentication:
 * - /login route for unauthenticated users
 * - / route shows session picker (start new / resume existing)
 * - /settings route for credit balance, purchases, and payment management
 * - /adventure route shows the active stage (Invoking, etc.)
 * - /design-system route for design system verification
 * - AuthProvider wraps the entire app for auth state
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AuthPage } from '@/pages/AuthPage';
import { SessionPage } from '@/pages/SessionPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { AdventurePage } from '@/pages/AdventurePage';
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
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/adventure"
            element={
              <ProtectedRoute>
                <AdventurePage />
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
