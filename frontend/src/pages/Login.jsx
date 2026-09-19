import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, bypassLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleBypass = async () => {
    setError('');
    setLoading(true);
    try {
      await bypassLogin();
      navigate('/', { replace: true });
    } catch (err) {
      setError('Could not bypass login automatically. Please verify backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.message === 'Network Error' || !err.response) {
        setError('Cannot connect to backend server. Please verify the backend is running at http://localhost:8000.');
      } else {
        setError('Invalid email or password. Since previous logins were purged, please click Sign Up if you need a new account.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-12 bg-surface">
      <div className="w-full max-w-[460px] bg-surface-container-low/90 backdrop-blur-md rounded-2xl border border-outline-variant/60 shadow-glass-modal p-8 sm:p-10 transition-all">
        {/* Brand & Editorial Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-gilded-amber text-[20px]">
              auto_stories
            </span>
            <span className="font-meta-tag text-meta-tag uppercase text-secondary tracking-widest">
              ADAPTIVE MEDIA ENGINE
            </span>
          </div>
          <h1 className="font-headline-lg text-3xl sm:text-4xl text-on-surface italic font-serif tracking-tight mb-2">
            Welcome to Adaptive Media Engine
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            Access your calibrated preference vector, verified taste history, and deterministic recommendation shelves.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-error-container text-on-error-container rounded-lg font-body-sm text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
          {/* Email Ghost Input */}
          <div className="flex flex-col space-y-1">
            <label className="font-meta-label text-meta-label text-secondary uppercase tracking-widest" htmlFor="email">
              Email Address
            </label>
            <div className="relative flex items-center border-b border-outline-variant focus-within:border-primary transition-colors py-1">
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-transparent text-on-surface font-body-md text-sm placeholder:italic placeholder:text-outline focus:outline-none pr-8"
              />
              <span className="material-symbols-outlined absolute right-1 text-outline-variant text-[18px] pointer-events-none">
                alternate_email
              </span>
            </div>
          </div>

          {/* Password Ghost Input */}
          <div className="flex flex-col space-y-1">
            <label className="font-meta-label text-meta-label text-secondary uppercase tracking-widest" htmlFor="password">
              Password
            </label>
            <div className="relative flex items-center border-b border-outline-variant focus-within:border-primary transition-colors py-1">
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full bg-transparent text-on-surface font-body-md text-sm placeholder:text-outline focus:outline-none pr-8"
              />
              <span className="material-symbols-outlined absolute right-1 text-outline-variant text-[18px] pointer-events-none">
                lock
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleBypass}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 px-6 rounded-full font-button-text text-button-text uppercase tracking-widest shadow-md hover:shadow-xl transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">bolt</span>
              <span>{loading ? 'Entering…' : 'Bypass Login (Instant Access)'}</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-container text-on-primary py-3.5 px-6 rounded-full font-button-text text-button-text uppercase tracking-widest shadow-md hover:shadow-xl transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 group"
            >
              <span>{loading ? 'Signing In…' : 'Sign In to Adaptive Media Engine'}</span>
              <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </button>
          </div>
        </form>

        {/* Footnote Link */}
        <div className="flex flex-col items-center space-y-2 pt-6 mt-6 border-t border-outline-variant/40 text-center">
          <p className="font-body-sm text-body-sm text-secondary">
            Don't have an account?{' '}
            <Link to="/signup" className="text-on-surface font-medium underline underline-offset-4 hover:text-primary transition-colors">
              Create Profile
            </Link>
          </p>
          <span className="font-meta-tag text-[9px] uppercase tracking-widest text-secondary pt-1">
            Zero Tracking • Deterministic Embeddings
          </span>
        </div>
      </div>
    </div>
  );
};
