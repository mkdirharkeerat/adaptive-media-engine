import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-black relative">
      {/* Subtle Apple Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-apple-blue/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-apple-green/10 rounded-full blur-3xl pointer-events-none" />

      <div className="apple-card w-full max-w-md p-9 rounded-squircle-2xl border border-white/15 shadow-apple-card relative z-10 space-y-7">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-squircle bg-gradient-to-tr from-[#30D158] via-[#0A84FF] to-[#BF5AF2] flex items-center justify-center shadow-apple-glow mx-auto mb-3">
            <Compass className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Sign In to Adaptive Media</h1>
          <p className="text-xs text-apple-textSecondary">Human-aligned recommendation powered by depth signals</p>
        </div>

        {error && (
          <div className="p-3.5 rounded-squircle bg-apple-red/10 border border-apple-red/25 text-xs text-apple-red flex items-center space-x-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
            className="w-full py-3 rounded-full bg-apple-blue hover:bg-apple-blueHover text-white text-xs font-bold shadow-apple-blue-glow transition-all flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-95 mt-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center border-t border-white/[0.08]">
          <p className="text-xs text-apple-textSecondary">
            Don't have an account?{' '}
            <Link to="/signup" className="text-apple-blue hover:underline font-semibold">
              Create Taste Profile
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
