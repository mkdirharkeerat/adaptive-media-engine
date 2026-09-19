import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [handle, setHandle] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('clean');
  const [manifestoConsent, setManifestoConsent] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!manifestoConsent) {
      setError('Please acknowledge the anti-manipulation manifesto constraint.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await signup(email, password);
      navigate('/onboarding');
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.message === 'Network Error' || !err.response) {
        setError('Cannot connect to backend server. Please verify the backend is running at http://localhost:8000.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-12 bg-surface">
      <div className="w-full max-w-[480px] bg-surface-container-low/90 backdrop-blur-md rounded-2xl border border-outline-variant/60 shadow-glass-modal p-8 sm:p-10 transition-all">
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
            Create Adaptive Media Engine Profile
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            Calibrated for genuine taste, zero engagement traps, and cryptographic data sovereignty.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-error-container text-on-error-container rounded-lg font-body-sm text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col space-y-5">
          {/* Handle / Name Input */}
          <div className="flex flex-col space-y-1">
            <label className="font-meta-label text-meta-label text-secondary uppercase tracking-widest" htmlFor="handle">
              Your Name
            </label>
            <div className="relative flex items-center border-b border-outline-variant focus-within:border-primary transition-colors py-1">
              <input
                id="handle"
                type="text"
                required
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="e.g. Alex Chen"
                className="w-full bg-transparent text-on-surface font-body-md text-sm placeholder:italic placeholder:text-outline focus:outline-none pr-8"
              />
              <span className="material-symbols-outlined absolute right-1 text-outline-variant text-[18px] pointer-events-none">
                person
              </span>
            </div>
          </div>

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
            <div className="flex justify-between items-center">
              <label className="font-meta-label text-meta-label text-secondary uppercase tracking-widest" htmlFor="password">
                Password
              </label>
              <span className="font-meta-tag text-[9px] text-secondary uppercase">Min. 6 Characters</span>
            </div>
            <div className="relative flex items-center border-b border-outline-variant focus-within:border-primary transition-colors py-1">
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-transparent text-on-surface font-body-md text-sm placeholder:text-outline focus:outline-none pr-8"
              />
              <span className="material-symbols-outlined absolute right-1 text-outline-variant text-[18px] pointer-events-none">
                lock
              </span>
            </div>
          </div>

          {/* Initial Ledger Format Selector Pills */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="font-meta-label text-meta-label text-secondary uppercase tracking-widest">
                Initial Taste Import Target
              </span>
              <span className="font-meta-tag text-meta-tag text-gilded-amber uppercase">
                Optional
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedFormat('goodreads')}
                className={`py-2 px-2 rounded-lg text-center transition-all ${
                  selectedFormat === 'goodreads'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container text-secondary hover:text-on-surface border border-outline-variant/60'
                }`}
              >
                <span className="block font-meta-tag text-[10px] uppercase font-bold tracking-wider">GOODREADS</span>
                <span className="block text-[8px] opacity-70 font-mono">.CSV EXPORT</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedFormat('letterboxd')}
                className={`py-2 px-2 rounded-lg text-center transition-all ${
                  selectedFormat === 'letterboxd'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container text-secondary hover:text-on-surface border border-outline-variant/60'
                }`}
              >
                <span className="block font-meta-tag text-[10px] uppercase font-bold tracking-wider">LETTERBOXD</span>
                <span className="block text-[8px] opacity-70 font-mono">.CSV EXPORT</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedFormat('clean')}
                className={`py-2 px-2 rounded-lg text-center transition-all ${
                  selectedFormat === 'clean'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container text-secondary hover:text-on-surface border border-outline-variant/60'
                }`}
              >
                <span className="block font-meta-tag text-[10px] uppercase font-bold tracking-wider">CLEAN SLATE</span>
                <span className="block text-[8px] opacity-70 font-mono">MANUAL TASTE</span>
              </button>
            </div>
          </div>

          {/* Anti-manipulation Manifesto Consent */}
          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer select-none group">
              <input
                type="checkbox"
                checked={manifestoConsent}
                onChange={(e) => setManifestoConsent(e.target.checked)}
                className="mt-0.5 accent-primary h-4 w-4 rounded"
              />
              <span className="font-body-sm text-[12px] text-on-surface-variant leading-snug group-hover:text-on-surface transition-colors">
                I understand recommendations are delivered in fixed batches with zero infinite scroll, no notification urgency, and no engagement bait.
              </span>
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-container text-on-primary py-3.5 px-6 rounded-full font-button-text text-button-text uppercase tracking-widest shadow-md hover:shadow-xl transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 group"
            >
              <span>{loading ? 'Creating Profile…' : 'Create Adaptive Media Engine Profile'}</span>
              <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </button>
          </div>
        </form>

        {/* Footnote Link */}
        <div className="flex flex-col items-center space-y-2 pt-6 mt-6 border-t border-outline-variant/40 text-center">
          <p className="font-body-sm text-body-sm text-secondary">
            Already have an account?{' '}
            <Link to="/login" className="text-on-surface font-medium underline underline-offset-4 hover:text-primary transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
