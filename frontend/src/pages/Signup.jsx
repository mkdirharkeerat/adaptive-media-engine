import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Lock, Mail, User, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signup(email, password, fullName);
      navigate('/onboarding');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-black relative">
      {/* Ambient Glows */}
      <div className="absolute top-1/4 right-1/2 w-96 h-96 bg-apple-green/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-apple-indigo/15 rounded-full blur-3xl pointer-events-none" />

      <div className="apple-card w-full max-w-md p-9 rounded-squircle-2xl border border-white/15 shadow-apple-card relative z-10 space-y-7">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-squircle bg-gradient-to-tr from-[#30D158] via-[#0A84FF] to-[#BF5AF2] flex items-center justify-center shadow-apple-glow mx-auto mb-3">
            <Compass className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Create Taste Profile</h1>
          <p className="text-xs text-apple-textSecondary">Zero dark patterns, true completion depth modeling</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-squircle bg-apple-red/10 border border-apple-red/25 text-xs text-apple-red flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-white block mb-1.5">Full Name</label>
            <div className="relative">
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Steve Jobs"
                className="w-full pl-10 pr-4 py-2.5 rounded-squircle bg-white/[0.06] border border-white/15 text-xs text-white placeholder-apple-textTertiary focus:outline-none focus:border-apple-blue transition-colors"
              />
              <User className="w-4 h-4 text-apple-textTertiary absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-white block mb-1.5">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@apple.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-squircle bg-white/[0.06] border border-white/15 text-xs text-white placeholder-apple-textTertiary focus:outline-none focus:border-apple-blue transition-colors"
              />
              <Mail className="w-4 h-4 text-apple-textTertiary absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-white block mb-1.5">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-squircle bg-white/[0.06] border border-white/15 text-xs text-white placeholder-apple-textTertiary focus:outline-none focus:border-apple-blue transition-colors"
              />
              <Lock className="w-4 h-4 text-apple-textTertiary absolute left-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-apple-green hover:bg-apple-green/90 text-black text-xs font-bold shadow-apple-glow transition-all flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-95 mt-2"
          >
            <span>{loading ? 'Creating Profile...' : 'Begin Setup'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center border-t border-white/[0.08]">
          <p className="text-xs text-apple-textSecondary">
            Already have an account?{' '}
            <Link to="/login" className="text-apple-blue hover:underline font-semibold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
