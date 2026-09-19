import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { HistoryImportModal } from './HistoryImportModal';

export const Navbar = () => {
  const { isAuthenticated, logout, preferences } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  if (!isAuthenticated) return null;

  const navLinks = [
    { label: 'Recommendations', path: '/' },
    { label: 'Catalog', path: '/search' },
    { label: 'History', path: '/history' },
    { label: 'ML Lab', path: '/ml-lab' },
    { label: 'Values', path: '/settings' },
  ];

  return (
    <>
      <header className="sticky top-0 w-full z-40 bg-surface/85 backdrop-blur-md border-b border-outline-variant shadow-[0_1px_8px_rgba(0,0,0,0.03)] transition-colors">
        <div className="h-20 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between gap-6">
          {/* Brand Lockup */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gilded-amber opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-gilded-amber"></span>
            </span>
            <div className="flex flex-col text-left">
              <span className="font-meta-tag text-meta-tag uppercase text-on-surface-variant tracking-wider">
                ADAPTIVE MEDIA ENGINE
              </span>
              <span className="font-headline-sm text-[15px] italic text-on-surface leading-none mt-1 group-hover:text-gilded-amber transition-colors">
                Algorithmic Transparency
              </span>
            </div>
          </Link>

          {/* Center Segmented Nav */}
          <nav className="hidden lg:flex items-center gap-1 p-1 bg-surface-container rounded-full border border-outline-variant/60 shadow-inner">
            {navLinks.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-1.5 rounded-full font-button-text text-button-text uppercase transition-all ${
                    isActive
                      ? 'bg-primary text-on-primary shadow-sm font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Dark / Light Toggle */}
            <button
              aria-label="Toggle Theme"
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all"
              type="button"
              title={`Switch to ${isDark ? 'Light Parchment' : 'Evening Reading Room'} Mode`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {/* Quick Import History Action */}
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-pill-padding-x py-pill-padding-y rounded-full bg-primary text-on-primary hover:bg-primary-container font-button-text text-button-text uppercase shadow-sm transition-all"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">sync_alt</span>
              <span>Import History</span>
            </button>

            {/* User Profile / Logout */}
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              title="Sign Out of Adaptive Media Engine"
              className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-error hover:text-on-error flex items-center justify-center text-on-surface transition-all"
            >
              <span className="material-symbols-outlined text-[17px]">logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="lg:hidden flex items-center justify-around px-4 py-2 bg-surface-container border-t border-outline-variant overflow-x-auto">
          {navLinks.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1 rounded-full font-meta-tag text-[10px] uppercase whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-primary text-on-primary font-semibold'
                    : 'text-on-surface-variant'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </header>

      {/* History Import Modal */}
      <HistoryImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={() => {
          if (location.pathname === '/history' || location.pathname === '/') {
            window.location.reload();
          }
        }}
      />
    </>
  );
};
