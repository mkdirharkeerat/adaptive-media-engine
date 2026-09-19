import React, { useMemo, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  CONTENT_INTENTS,
  GENRES_BY_MODE,
  PACING_BANDS,
  SESSION_CONTEXTS,
  STYLE_AXES,
  bandsToPacingValue,
  defaultStyleAxes,
  splitLegacyContext,
} from '../data/taxonomy';

const MODE_OPTIONS = [
  {
    id: 'fiction',
    label: 'Fiction',
    copy: 'Novels, literary film, speculative worlds, character drama.',
  },
  {
    id: 'entertainment',
    label: 'Entertainment',
    copy: 'Watch-first movies and series — action, comedy, thrillers, comfort TV.',
  },
  {
    id: 'non-fiction',
    label: 'Non-fiction',
    copy: 'Documentaries, essays, science, history, and self-improvement.',
  },
];

export const ValuesSelectorForm = ({ onSaved, isInitial = false, initialContentModes }) => {
  const { preferences, setPreferences } = useAuth();
  const legacy = splitLegacyContext(preferences?.viewing_context || ['casual']);

  const [contentModes, setContentModes] = useState(
    initialContentModes?.length
      ? initialContentModes
      : preferences?.content_modes?.length
        ? preferences.content_modes
        : ['fiction', 'entertainment']
  );
  const [preferredGenres, setPreferredGenres] = useState(preferences?.preferred_genres || []);
  const [pacingBands, setPacingBands] = useState(
    preferences?.pacing_bands?.length ? preferences.pacing_bands : ['balanced']
  );
  const [pacingByMode, setPacingByMode] = useState(preferences?.pacing_by_mode || {});
  const [usePerModePacing, setUsePerModePacing] = useState(
    Boolean(preferences?.pacing_by_mode && Object.keys(preferences.pacing_by_mode).length)
  );
  const [intensity, setIntensity] = useState(preferences?.intensity ?? 0.6);
  const [languageMix, setLanguageMix] = useState(preferences?.language_mix_ok ?? true);
  const [sessionContext, setSessionContext] = useState(
    legacy.session.length ? legacy.session : ['casual']
  );
  const [contentIntent, setContentIntent] = useState(
    preferences?.content_intent?.length ? preferences.content_intent : legacy.intent
  );
  const [subGenreValues, setSubGenreValues] = useState({
    ...defaultStyleAxes,
    ...(preferences?.sub_genre_values || {}),
  });
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const visibleGenreGroups = useMemo(() => {
    const modes = contentModes.length ? contentModes : ['fiction'];
    return modes.map((mode) => ({
      mode,
      label: MODE_OPTIONS.find((m) => m.id === mode)?.label || mode,
      genres: GENRES_BY_MODE[mode] || [],
    }));
  }, [contentModes]);

  const toggleList = (list, id, minOne = false) => {
    if (list.includes(id)) {
      if (minOne && list.length === 1) return list;
      return list.filter((x) => x !== id);
    }
    return [...list, id];
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSavedMsg('');
    try {
      const payload = {
        pacing: bandsToPacingValue(pacingBands, 0.5),
        intensity: parseFloat(intensity),
        viewing_context: sessionContext,
        sub_genre_values: subGenreValues,
        language_mix_ok: languageMix,
        preferred_genres: preferredGenres,
        pacing_bands: pacingBands,
        pacing_by_mode: usePerModePacing ? pacingByMode : {},
        content_modes: contentModes,
        content_intent: contentIntent,
      };
      const res = await api.put('/preferences', payload);
      setPreferences(res.data);
      setSavedMsg(`Profile Version ${res.data.version} Saved`);
      setTimeout(() => setSavedMsg(''), 3500);
      if (onSaved) onSaved(res.data);
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleGenre = (id) => {
    setPreferredGenres((prev) => toggleList(prev, id));
  };

  const toggleBand = (id, modeKey = null) => {
    if (modeKey) {
      setPacingByMode((prev) => {
        const current = prev[modeKey] || [];
        return { ...prev, [modeKey]: toggleList(current, id) };
      });
      return;
    }
    setPacingBands((prev) => {
      const next = toggleList(prev, id);
      return next.length ? next : ['balanced'];
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-10">
      <div className="p-6 sm:p-8 bg-surface-container rounded-2xl border border-outline-variant/60 space-y-5">
        <div>
          <span className="font-meta-tag text-meta-tag uppercase text-gilded-amber font-semibold tracking-wider">
            MODE · WHAT YOU WANT
          </span>
          <h3 className="font-headline-sm text-headline-sm text-on-surface mt-1">
            Fiction, entertainment, or non-fiction
          </h3>
          <p className="font-body-sm text-body-sm text-secondary mt-1">
            Separate story, watch-first entertainment, and real-world learning. Pick one or more.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {MODE_OPTIONS.map((mode) => {
            const selected = contentModes.includes(mode.id);
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setContentModes((prev) => toggleList(prev, mode.id, true))}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selected
                    ? 'bg-primary text-on-primary border-primary shadow-sm'
                    : 'bg-surface-container-low text-on-surface border-outline-variant/60 hover:bg-surface-container-high'
                }`}
              >
                <span className="font-meta-tag text-meta-tag uppercase font-semibold">{mode.label}</span>
                <span className={`block font-body-sm text-[12px] mt-1 ${selected ? 'text-on-primary/75' : 'text-secondary'}`}>
                  {mode.copy}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-6 sm:p-8 bg-surface-container rounded-2xl border border-outline-variant/60 space-y-6">
        <div>
          <span className="font-meta-tag text-meta-tag uppercase text-gilded-amber font-semibold tracking-wider">
            GENRES · MULTI-SELECT
          </span>
          <h3 className="font-headline-sm text-headline-sm text-on-surface mt-1">
            Canonical genres for the modes you chose
          </h3>
          <p className="font-body-sm text-body-sm text-secondary mt-1">
            Optional. Leave empty if you do not want a genre prior.
          </p>
        </div>
        {visibleGenreGroups.map((group) => (
          <div key={group.mode} className="space-y-2">
            <span className="font-meta-label text-meta-label uppercase text-on-surface-variant tracking-wider block">
              {group.label}
            </span>
            <div className="flex flex-wrap gap-2">
              {group.genres.map((opt) => {
                const selected = preferredGenres.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleGenre(opt.id)}
                    className={`px-4 py-2 rounded-full font-meta-tag text-meta-tag uppercase transition-all ${
                      selected
                        ? 'bg-primary text-on-primary font-bold'
                        : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface border border-outline-variant/60'
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

      <div className="p-6 sm:p-8 bg-surface-container rounded-2xl border border-outline-variant/60 space-y-6">
        <div>
          <span className="font-meta-tag text-meta-tag uppercase text-gilded-amber font-semibold tracking-wider">
            PACING & INTENSITY
          </span>
          <h3 className="font-headline-sm text-headline-sm text-on-surface mt-1">
            Named cadence bands
          </h3>
          <p className="font-body-sm text-body-sm text-secondary mt-1">
            Choose one or more bands. Optionally set different pacing for fiction vs entertainment.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {PACING_BANDS.map((band) => {
            const selected = pacingBands.includes(band.id);
            return (
              <button
                key={band.id}
                type="button"
                onClick={() => toggleBand(band.id)}
                className={`px-4 py-2 rounded-full font-meta-tag text-meta-tag uppercase transition-all ${
                  selected
                    ? 'bg-primary text-on-primary font-bold'
                    : 'bg-surface-container-low text-on-surface-variant border border-outline-variant/60'
                }`}
              >
                {band.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setUsePerModePacing((v) => !v)}
          className="font-meta-tag text-meta-tag uppercase text-gilded-amber hover:underline"
        >
          {usePerModePacing ? 'Use one pacing set for all modes' : 'Use different pacing per mode'}
        </button>

        {usePerModePacing &&
          contentModes.map((mode) => (
            <div key={mode} className="space-y-2">
              <span className="font-meta-label text-meta-label uppercase text-on-surface-variant tracking-wider block">
                {mode} pacing
              </span>
              <div className="flex flex-wrap gap-2">
                {PACING_BANDS.map((band) => {
                  const selected = (pacingByMode[mode] || []).includes(band.id);
                  return (
                    <button
                      key={`${mode}-${band.id}`}
                      type="button"
                      onClick={() => toggleBand(band.id, mode)}
                      className={`px-3 py-1.5 rounded-full font-meta-tag text-[10px] uppercase transition-all ${
                        selected
                          ? 'bg-primary text-on-primary font-bold'
                          : 'bg-surface-container-low text-on-surface-variant border border-outline-variant/60'
                      }`}
                    >
                      {band.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

        <div className="space-y-3 pt-2">
          <div className="flex items-baseline justify-between font-meta-label text-meta-label uppercase">
            <span className="text-on-surface font-semibold tracking-wider">Content intensity</span>
            <span className="text-gilded-amber font-mono">
              {intensity < 0.35 ? 'Light & restorative' : intensity > 0.7 ? 'Visceral & heavy' : 'Moderate gravitas'} ({Math.round(intensity * 100)}%)
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={intensity}
            onChange={(e) => setIntensity(e.target.value)}
            className="w-full h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>
      </div>

      <div className="p-6 sm:p-8 bg-surface-container rounded-2xl border border-outline-variant/60 space-y-6">
        <div>
          <span className="font-meta-tag text-meta-tag uppercase text-gilded-amber font-semibold tracking-wider">
            STYLE AXES · OPTIONAL
          </span>
          <h3 className="font-headline-sm text-headline-sm text-on-surface mt-1">
            Tone modifiers (skipped when set to doesn&apos;t matter)
          </h3>
        </div>
        <div className="space-y-5">
          {STYLE_AXES.map((cat) => (
            <div key={cat.key} className="space-y-2">
              <span className="font-meta-label text-meta-label uppercase text-on-surface-variant tracking-wider block">
                {cat.label}
              </span>
              <div className="flex flex-wrap gap-2.5">
                {cat.options.map((opt) => {
                  const isSelected = (subGenreValues[cat.key] || 'any') === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSubGenreValues({ ...subGenreValues, [cat.key]: opt.id })}
                      className={`px-4 py-2 rounded-full font-meta-tag text-meta-tag uppercase transition-all ${
                        isSelected
                          ? 'bg-primary text-on-primary font-bold'
                          : 'bg-surface-container-low text-on-surface-variant border border-outline-variant/60'
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

      <div className="p-6 sm:p-8 bg-surface-container rounded-2xl border border-outline-variant/60 space-y-6">
        <div>
          <span className="font-meta-tag text-meta-tag uppercase text-gilded-amber font-semibold tracking-wider">
            SESSION · HOW YOU CONSUME
          </span>
          <h3 className="font-headline-sm text-headline-sm text-on-surface mt-1">
            Delivery cadence
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SESSION_CONTEXTS.map((ctx) => {
            const isSelected = sessionContext.includes(ctx.id);
            return (
              <button
                key={ctx.id}
                type="button"
                onClick={() => setSessionContext((prev) => toggleList(prev, ctx.id, true))}
                className={`p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container-low text-on-surface border-outline-variant/60'
                }`}
              >
                <span className="font-meta-tag text-meta-tag uppercase font-semibold">{ctx.label}</span>
                <span className={`block font-body-sm text-[12px] mt-0.5 ${isSelected ? 'text-on-primary/70' : 'text-secondary'}`}>
                  {ctx.hint}
                </span>
              </button>
            );
          })}
        </div>

        {contentModes.includes('non-fiction') && (
          <div className="space-y-3 pt-2 border-t border-outline-variant/40">
            <span className="font-meta-label text-meta-label uppercase text-on-surface-variant tracking-wider block">
              Non-fiction intent
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {CONTENT_INTENTS.map((intent) => {
                const selected = contentIntent.includes(intent.id);
                return (
                  <button
                    key={intent.id}
                    type="button"
                    onClick={() => setContentIntent((prev) => toggleList(prev, intent.id))}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      selected
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface-container-low text-on-surface border-outline-variant/60'
                    }`}
                  >
                    <span className="font-meta-tag text-meta-tag uppercase font-semibold">{intent.label}</span>
                    <span className={`block font-body-sm text-[12px] mt-0.5 ${selected ? 'text-on-primary/70' : 'text-secondary'}`}>
                      {intent.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-outline-variant/40 flex items-center justify-between">
          <div className="flex flex-col pr-4">
            <span className="font-meta-label text-meta-label uppercase text-on-surface tracking-wider font-semibold">
              Mixed language & dialect
            </span>
            <span className="font-body-sm text-body-sm text-secondary mt-0.5">
              Allow cross-lingual titles and untranslated dialogue.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setLanguageMix(!languageMix)}
            className={`w-12 h-6 rounded-full transition-colors relative shrink-0 p-0.5 ${
              languageMix ? 'bg-primary' : 'bg-surface-container-highest'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-surface-bright shadow-sm transform transition-transform ${
                languageMix ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="w-full sm:max-w-md py-4 px-8 rounded-full bg-primary hover:bg-primary-container text-on-primary font-button-text text-button-text uppercase tracking-widest shadow-md transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[16px]">bookmark</span>
          <span>{saving ? 'Saving values...' : isInitial ? 'Save boundaries & enter library' : 'Persist versioned preferences'}</span>
        </button>
        {savedMsg && (
          <span className="font-meta-tag text-meta-tag uppercase text-gilded-amber font-semibold">
            ✓ {savedMsg}
          </span>
        )}
      </div>
    </form>
  );
};
