import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Onboarding } from './pages/Onboarding';
import { Recommendations } from './pages/Recommendations';
import { ItemDetail } from './pages/ItemDetail';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { SearchCatalog } from './pages/SearchCatalog';
import { MlLab } from './pages/MlLab';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="w-9 h-9 border-2 border-apple-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const App = () => {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-apple-blue/20 selection:text-apple-blue transition-colors duration-300">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Protected Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Recommendations />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute>
                      <Onboarding />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ml-lab"
                  element={
                    <ProtectedRoute>
                      <MlLab />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/media/:id"
                  element={
                    <ProtectedRoute>
                      <ItemDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <ProtectedRoute>
                      <History />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/search"
                  element={
                    <ProtectedRoute>
                      <SearchCatalog />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            {/* Minimal Clean Footer */}
            <footer className="apple-liquid-nav border-t border-[var(--border-color)] py-4 px-6 text-center text-xs text-[var(--text-tertiary)] font-mono transition-colors">
              Adaptive Media Recommendation • Genuine Taste & Depth Signals • Zero Dark Patterns
            </footer>
          </div>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
