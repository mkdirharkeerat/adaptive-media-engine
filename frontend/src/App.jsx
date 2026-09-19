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
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="font-meta-tag text-meta-tag uppercase text-secondary tracking-widest">
            Loading Adaptive Media Engine…
          </span>
        </div>
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
          <div className="min-h-screen flex flex-col bg-surface text-on-surface transition-colors duration-300">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Authentication Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Protected Engine Routes */}
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

            {/* Adaptive Media Engine Editorial Footer */}
            <footer className="w-full bg-surface-container-low border-t border-outline-variant/50 py-10 mt-16 transition-colors">
              <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex flex-col gap-1 text-center md:text-left">
                  <span className="font-meta-tag text-meta-tag uppercase text-on-surface-variant font-semibold tracking-wider">
                    ADAPTIVE MEDIA ENGINE • CITATION PROTOCOL
                  </span>
                  <p className="font-body-sm text-body-sm text-secondary">
                    Transparent attribution and bias-minimized recommendation matrices across narrative forms.
                  </p>
                </div>
                <div className="flex items-center gap-6 font-meta-tag text-meta-tag uppercase text-on-surface-variant">
                  <span>Audited Metrics</span>
                  <span>•</span>
                  <span>PgVector Schema</span>
                  <span>•</span>
                  <span>Zero Dark Patterns</span>
                </div>
              </div>
            </footer>
          </div>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;
