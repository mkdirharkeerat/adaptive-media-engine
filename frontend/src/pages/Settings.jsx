import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ValuesSelectorForm } from '../components/ValuesSelectorForm';
import { api } from '../api/client';

export const Settings = () => {
  const { user, preferences, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [exporting, setExporting] = useState(false);
  const [purgeConfirm, setPurgeConfirm] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await api.get('/history');
      const dataStr = JSON.stringify(res.data || [], null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `adaptive-media-ledger-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const handlePurge = async () => {
    if (!purgeConfirm) {
      setPurgeConfirm(true);
      return;
    }
    try {
      // Clear token and logout
      logout();
      window.location.href = '/login';
    } catch (err) {
      console.error('Purge failed:', err);
    }
  };

  return (
    <div className="w-full bg-surface min-h-screen">
      <div className="max-w-[720px] mx-auto px-6 lg:px-8 py-12 flex flex-col gap-12">
        {/* Header */}
        <div className="flex flex-col gap-2 pb-6 border-b border-outline-variant/60">
          <span className="font-meta-tag text-meta-tag uppercase text-gilded-amber tracking-widest font-semibold">
            ADAPTIVE MEDIA ENGINE · SETTINGS
          </span>
          <h1 className="font-headline-lg text-4xl font-serif text-on-surface tracking-tight">
            Settings &amp; Taste Boundaries
          </h1>
          <p className="font-body-md text-body-md text-secondary">
            Manage your versioned preference prior, visual atmosphere, and export your personal reading ledger.
          </p>
        </div>

        {/* Section 1: Explicit Values Selector */}
        <div>
          <ValuesSelectorForm />
        </div>

        {/* Section 2: Atmosphere / Appearance */}
        <div className="p-6 sm:p-8 bg-surface-container rounded-2xl border border-outline-variant/60 space-y-5">
          <div className="flex flex-col gap-1">
            <span className="font-meta-label text-meta-label uppercase text-on-surface-variant tracking-wider">
              Atmospheric Rendering
            </span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              Reading Room Lighting
            </h3>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex flex-col">
              <span className="font-body-md text-body-md font-medium text-on-surface">
                {isDark ? 'Obsidian Evening Palette' : 'Warm Parchment Palette'}
              </span>
              <span className="font-body-sm text-body-sm text-secondary">
                {isDark ? 'Lit by desk lamps at dusk, low glare dark mode' : 'Traditional unbleached warm parchment light mode'}
              </span>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="px-5 py-2 rounded-full bg-surface-bright text-on-surface border border-outline-variant/80 font-button-text text-button-text uppercase hover:bg-surface-container-high transition-all flex items-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
              <span>{isDark ? 'Light Parchment' : 'Dark Obsidian'}</span>
            </button>
          </div>
        </div>

        {/* Section 3: Data Sovereignty & Portability */}
        <div className="p-6 sm:p-8 bg-surface-container rounded-2xl border border-outline-variant/60 space-y-6">
          <div className="flex flex-col gap-1">
            <span className="font-meta-label text-meta-label uppercase text-on-surface-variant tracking-wider">
              Data Sovereignty
            </span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              Data Portability & Export
            </h3>
            <p className="font-body-sm text-body-sm text-secondary">
              Zero telemetry tracking, zero session length counters, zero dark patterns.
            </p>
          </div>

          <div className="space-y-4 pt-2 border-t border-outline-variant/40">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-body-md text-body-md font-medium text-on-surface">
                  Export Taste Ledger (JSON)
                </span>
                <span className="font-body-sm text-body-sm text-secondary">
                  Download every logged completion point, rating, and rewatch count.
                </span>
              </div>
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="px-4 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-container text-on-surface font-button-text text-button-text uppercase border border-outline-variant transition-colors"
              >
                {exporting ? 'Exporting…' : 'Export JSON'}
              </button>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-outline-variant/30">
              <div className="flex flex-col">
                <span className="font-body-md text-body-md font-medium text-error">
                  Reset Client Session
                </span>
                <span className="font-body-sm text-body-sm text-secondary">
                  Clear session token and reset client-side cache.
                </span>
              </div>
              <button
                type="button"
                onClick={handlePurge}
                className="font-button-text text-button-text uppercase text-error hover:underline transition-colors"
              >
                {purgeConfirm ? 'Click to confirm reset' : 'Purge Session'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
