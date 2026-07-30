import React, { useState } from 'react';
import { Sliders, Sparkles, Zap, Clock, ShieldAlert, Globe, Save } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const ValuesSelectorForm = ({ onSaved, isInitial = false }) => {
  const { preferences, setPreferences } = useAuth();

  const [pacing, setPacing] = useState(preferences?.pacing ?? 0.5);
  const [intensity, setIntensity] = useState(preferences?.intensity ?? 0.6);
  const [languageMix, setLanguageMix] = useState(preferences?.language_mix_ok ?? true);
  
  const [viewingContext, setViewingContext] = useState(
    preferences?.viewing_context || ['casual', 'binge']
  );

  const [subGenreValues, setSubGenreValues] = useState(
    preferences?.sub_genre_values || {
      romance: 'slow-burn',
      action: 'raw/gritty',
      protagonists: 'morally-gray',
      tone: 'challenging',
    }
  );

  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const toggleContext = (ctx) => {
    if (viewingContext.includes(ctx)) {
      if (viewingContext.length > 1) {
        setViewingContext(viewingContext.filter((c) => c !== ctx));
      }
    } else {
      setViewingContext([...viewingContext, ctx]);
    }
  };

  const setSubGenreTag = (category, value) => {
    setSubGenreValues({
      ...subGenreValues,
      [category]: value,
    });
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSavedMsg('');
    try {
      const payload = {
        pacing: parseFloat(pacing),
        intensity: parseFloat(intensity),
        viewing_context: viewingContext,
        sub_genre_values: subGenreValues,
        language_mix_ok: languageMix,
      };

      const res = await api.put('/preferences', payload);
      setPreferences(res.data);
      setSavedMsg(`Saved as Version ${res.data.version}`);
      setTimeout(() => setSavedMsg(''), 3000);
      if (onSaved) onSaved(res.data);
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  const subGenreCategories = [
    {
      key: 'romance',
      label: 'Romance Arc',
      options: [
        { id: 'slow-burn', label: 'Slow-Burn & Atmospheric' },
        { id: 'fast-paced', label: 'Fast-Paced Romance' },
      ],
    },
    {
      key: 'action',
      label: 'Action Style',
      options: [
        { id: 'raw/gritty', label: 'Raw & Gritty Survival' },
        { id: 'choreographed', label: 'Choreographed & Stylized' },
      ],
    },
    {
      key: 'protagonists',
      label: 'Protagonist Morality',
      options: [
        { id: 'morally-gray', label: 'Morally-Gray & Complex' },
        { id: 'clear-cut', label: 'Clear-Cut Heroic' },
      ],
    },
    {
      key: 'tone',
      label: 'Intellectual Tone',
      options: [
        { id: 'challenging', label: 'Challenging & Layered' },
        { id: 'comfort', label: 'Comfort & Uplifting' },
      ],
    },
  ];

  const contextOptions = [
    { id: 'binge', label: 'Binge Mode', icon: Zap, desc: 'Deep immersive multi-hour sessions' },
    { id: 'casual', label: 'Casual Ongoing', icon: Clock, desc: '1 episode / chapter after work' },
    { id: 'one-off', label: 'One-Off Night', icon: Sparkles, desc: 'Single contained movie or book' },
  ];

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* 1. Sub-Genre Preferences */}
      <div className="apple-card p-7 rounded-squircle-2xl space-y-5">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-apple-green" />
            <h3 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
              Explicit Sub-Genre Values (Hard Prior)
            </h3>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Guides candidate generation so recommendations never stray outside your genuine interest bounds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subGenreCategories.map((cat) => (
            <div key={cat.key} className="bg-black/5 dark:bg-white/[0.03] p-4 rounded-squircle border border-[var(--border-color)] space-y-2.5">
              <label className="text-xs font-semibold text-[var(--text-primary)] block">
                {cat.label}
              </label>
              <div className="grid grid-cols-2 gap-2 apple-segmented-pill p-1 rounded-squircle-sm">
                {cat.options.map((opt) => {
                  const isSelected = subGenreValues[cat.key] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSubGenreTag(cat.key, opt.id)}
                      className={`py-2 px-2.5 rounded-squircle-sm text-xs font-semibold text-center transition-all ${
                        isSelected
                          ? 'bg-[var(--pill-active-bg)] text-[var(--pill-active-text)] shadow-apple-subtle font-bold'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="apple-card p-6 rounded-squircle-2xl space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center space-x-2">
              <Sliders className="w-3.5 h-3.5 text-apple-blue" />
              <span>Pacing Preference</span>
            </label>
            <span className="text-xs text-apple-blue font-mono font-semibold">
              {pacing < 0.35 ? 'Slow & Atmospheric' : pacing > 0.65 ? 'Fast & Plot-Driven' : 'Balanced Mid-Tempo'}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={pacing}
            onChange={(e) => setPacing(e.target.value)}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-[var(--text-tertiary)] font-mono">
            <span>Slow & Atmospheric</span>
            <span>Fast & Plot-Driven</span>
          </div>
        </div>

        <div className="apple-card p-6 rounded-squircle-2xl space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center space-x-2">
              <ShieldAlert className="w-3.5 h-3.5 text-apple-orange" />
              <span>Content Intensity</span>
            </label>
            <span className="text-xs text-apple-orange font-mono font-semibold">
              {intensity < 0.35 ? 'Light & Gentle' : intensity > 0.65 ? 'Dark & Heavy' : 'Moderate'}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={intensity}
            onChange={(e) => setIntensity(e.target.value)}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-[var(--text-tertiary)] font-mono">
            <span>Light / Gentle</span>
            <span>Dark / Heavy</span>
          </div>
        </div>
      </div>

      {/* 3. Viewing Context */}
      <div className="apple-card p-7 rounded-squircle-2xl space-y-4">
        <div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-apple-indigo" />
            <h3 className="text-base font-bold text-[var(--text-primary)] tracking-tight">
              Consumption Context (Multi-Select)
            </h3>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Classifies active context delivery between deep binge sessions and daily casual cadences.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {contextOptions.map((ctx) => {
            const isSelected = viewingContext.includes(ctx.id);
            const Icon = ctx.icon;
            return (
              <button
                key={ctx.id}
                type="button"
                onClick={() => toggleContext(ctx.id)}
                className={`p-4 rounded-squircle-lg border text-left flex flex-col justify-between transition-all active:scale-[0.98] ${
                  isSelected
                    ? 'bg-apple-blue text-white border-apple-blue shadow-apple-blue-glow'
                    : 'bg-black/5 dark:bg-white/[0.03] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-black/20 dark:hover:border-white/20'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-apple-indigo'}`} />
                  <span className="text-xs font-bold">{ctx.label}</span>
                </div>
                <span className={`text-[11px] ${isSelected ? 'text-white/85' : 'text-[var(--text-tertiary)]'}`}>
                  {ctx.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Language Switch */}
      <div className="apple-card p-6 rounded-squircle-2xl flex items-center justify-between">
        <div className="flex items-start space-x-3.5">
          <div className="p-2 rounded-full bg-apple-blue/15 text-apple-blue mt-0.5">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <label className="text-sm font-semibold text-[var(--text-primary)] block">
              Multi-Language & Colloquial Slang Reasoning
            </label>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Enables the LLM to comprehend multilingual reviews, mixed cultural idioms, and slang.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setLanguageMix(!languageMix)}
          className={`w-12 h-7 flex items-center rounded-full p-1 transition-colors ${
            languageMix ? 'bg-apple-green shadow-apple-glow' : 'bg-black/20 dark:bg-white/20'
          }`}
        >
          <div
            className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
              languageMix ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-2">
        {savedMsg ? (
          <span className="text-xs text-apple-green font-mono font-semibold animate-pulse">
            ✓ {savedMsg}
          </span>
        ) : (
          <span className="text-xs text-[var(--text-tertiary)] font-mono">
            Every update increments preference version for auditability.
          </span>
        )}

        <button
          type="submit"
          disabled={saving}
          className="px-7 py-3 rounded-full bg-apple-blue hover:bg-apple-blueHover text-white text-xs font-bold shadow-apple-blue-glow transition-all flex items-center space-x-2 disabled:opacity-50 active:scale-95"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{saving ? 'Saving...' : isInitial ? 'Complete Selection' : 'Save Preference Version'}</span>
        </button>
      </div>
    </form>
  );
};
