import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Compass, Sparkles, Sliders, History, Search, LogOut, BrainCircuit, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const Navbar = () => {
  const { isAuthenticated, logout, preferences } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isAuthenticated) return null;

  const navItems = [
    { label: 'Explore', path: '/', icon: Sparkles },
    { label: 'History & Depth', path: '/history', icon: History },
    { label: 'AI & ML Lab', path: '/ml-lab', icon: BrainCircuit },
    { label: 'Catalog', path: '/search', icon: Search },
    { label: 'Values', path: '/settings', icon: Sliders },
  ];

  return (
    <header className="sticky top-4 z-50 px-4 lg:px-8 max-w-7xl mx-auto w-full transition-all">
      <div className="apple-liquid-nav rounded-squircle-xl px-4 py-2.5 flex items-center justify-between transition-all">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-squircle bg-gradient-to-tr from-[#30D158] via-[#0A84FF] to-[#BF5AF2] flex items-center justify-center shadow-apple-glow group-hover:scale-105 transition-transform">
            <Compass className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm tracking-tight text-[var(--text-primary)] group-hover:text-apple-blue transition-colors">
                Adaptive Media
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-apple-green/10 text-apple-green border border-apple-green/20">
                HIG
              </span>
            </div>
            {preferences && (
              <span className="text-[10px] text-[var(--text-tertiary)] font-mono block -mt-0.5">
                Taste State v{preferences.version}
              </span>
            )}
          </div>
        </Link>

        {/* Center Floating Segmented Nav */}
        <nav className="hidden md:flex items-center space-x-1 apple-segmented-pill p-1 rounded-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[var(--pill-active-bg)] text-[var(--pill-active-text)] shadow-apple-subtle'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/[0.06]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[var(--pill-active-text)]' : 'text-[var(--text-tertiary)]'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: Theme Toggle & Sign Out */}
        <div className="flex items-center space-x-2">
          {/* Apple Appearance Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/[0.08] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all border border-transparent hover:border-[var(--border-color)]"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-apple-orange transition-transform hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-apple-indigo transition-transform hover:-rotate-12" />
            )}
          </button>

          {/* Sign Out */}
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium text-[var(--text-secondary)] hover:text-apple-red hover:bg-apple-red/10 border border-transparent hover:border-apple-red/20 transition-all"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
