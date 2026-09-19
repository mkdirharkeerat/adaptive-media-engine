import React, { useState } from 'react';
import { api } from '../api/client';

export const DepthProgressTracker = ({
  mediaItem,
  initialHistory,
  onHistoryUpdated,
  compact = false,
}) => {
  const mediaType = mediaItem.media_type;
  const isEpisodic = mediaType === 'tv' || mediaType === 'book';
  const unitLabel = mediaType === 'book' ? 'Chapter' : 'Episode';
  const totalUnits =
    mediaItem.raw_metadata?.total_episodes ||
    mediaItem.raw_metadata?.total_chapters ||
    (mediaType === 'movie' ? 1 : 10);

  const initProgress = () => {
    if (initialHistory?.episode_progress && initialHistory.episode_progress.length > 0) {
      return initialHistory.episode_progress;
    }
    return Array.from({ length: totalUnits }, (_, i) => ({
      number: i + 1,
      completed: false,
    }));
  };

  const [episodes, setEpisodes] = useState(initProgress);
  const [rewatchCount, setRewatchCount] = useState(initialHistory?.rewatch_count || 0);
  const [rating, setRating] = useState(initialHistory?.rating || 0);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const completedCount = episodes.filter((e) => e.completed).length;
  const completionPct = isEpisodic
    ? Math.round((completedCount / totalUnits) * 100)
    : completedCount > 0 ? 100 : 0;
  const dropOffPoint =
    completedCount > 0
      ? Math.max(...episodes.filter((e) => e.completed).map((e) => e.number))
      : null;

  // Weighted True Interest Signal calculation
  const estimatedSignal = Math.min(
    100,
    Math.round(
      completionPct * 0.45 +
      (dropOffPoint ? (dropOffPoint / totalUnits) * 100 : 0) * 0.2 +
      (rating / 5) * 100 * 0.2 +
      Math.min(1, rewatchCount * 0.5) * 100 * 0.15
    )
  );

  const toggleEpisode = (idx) => {
    const updated = [...episodes];
    updated[idx].completed = !updated[idx].completed;
    setEpisodes(updated);
  };

  const markAll = (completed) => {
    const updated = episodes.map((e) => ({ ...e, completed }));
    setEpisodes(updated);
  };

  const saveProgress = async () => {
    setSaving(true);
    try {
      const payload = {
        media_item_id: mediaItem.id,
        completion_pct: completionPct,
        rewatch_count: rewatchCount,
        rating: rating > 0 ? rating : null,
        episode_progress: episodes,
        drop_off_point: dropOffPoint,
      };

      let res;
      if (initialHistory?.id) {
        res = await api.patch(`/history/${initialHistory.id}`, payload);
      } else {
        res = await api.post('/history', payload);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      if (onHistoryUpdated) onHistoryUpdated(res.data);
    } catch (err) {
      console.error('Failed to save depth progress', err);
    } finally {
      setSaving(false);
    }
  };

  if (compact) {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center justify-between font-meta-tag text-meta-tag text-on-surface-variant">
          <span>
            {isEpisodic ? `${completedCount}/${totalUnits} ${unitLabel.toUpperCase()}S` : 'PROGRESS'}
          </span>
          <span className="text-primary font-bold">{completionPct}%</span>
        </div>
        {/* Compact Ticks */}
        {isEpisodic ? (
          <div className="flex items-center gap-1">
            {episodes.slice(0, 12).map((ep, i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  ep.completed ? 'bg-primary' : 'bg-surface-container-highest'
                }`}
              />
            ))}
          </div>
        ) : (
          <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300 rounded-full"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 bg-surface-container rounded-2xl border border-outline-variant/60 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-outline-variant/60">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-on-surface">
              history_toggle_off
            </span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              Your History with This Title
            </h3>
          </div>
          <p className="font-body-sm text-body-sm text-secondary">
            Grounding telemetry: completion drop-off & repeat loops directly train the non-manipulative recommendation vector.
          </p>
        </div>

        {/* Calculated Signal Widget */}
        <div className="flex items-center gap-3 bg-surface-bright px-4 py-2.5 rounded-xl border border-outline-variant/60 shadow-sm shrink-0">
          <div className="text-right">
            <span className="font-meta-tag text-[9px] uppercase text-on-surface-variant block tracking-wider">
              True Interest Signal
            </span>
            <span className="font-meta-tag text-lg font-bold text-gilded-amber">
              {estimatedSignal}%
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gilded-amber/15 text-gilded-amber flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">insights</span>
          </div>
        </div>
      </div>

      {/* Ratings & Rewatches Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Star Rating */}
        <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/40 flex flex-col gap-2">
          <label className="font-meta-label text-meta-label uppercase text-on-surface-variant tracking-wider">
            Evaluation Rating
          </label>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(rating === star ? 0 : star)}
                className="p-1 transition-transform active:scale-90"
              >
                <span
                  className={`material-symbols-outlined text-[22px] transition-colors ${
                    star <= rating ? 'text-gilded-amber' : 'text-outline-variant hover:text-secondary'
                  }`}
                  style={{ fontVariationSettings: star <= rating ? "'FILL' 1" : "'FILL' 0" }}
                >
                  star
                </span>
              </button>
            ))}
            <span className="font-meta-tag text-meta-tag text-secondary ml-2 font-mono">
              {rating > 0 ? `${rating}.0 / 5.0` : 'Unrated'}
            </span>
          </div>
        </div>

        {/* Rewatch Count */}
        <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/40 flex flex-col gap-2">
          <label className="font-meta-label text-meta-label uppercase text-on-surface-variant tracking-wider">
            Rewatch / Reread Multiplier
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setRewatchCount(Math.max(0, rewatchCount - 1))}
              className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-surface text-on-surface flex items-center justify-center font-bold border border-outline-variant transition-colors"
            >
              -
            </button>
            <span className="font-meta-tag text-sm font-bold text-on-surface font-mono">
              {rewatchCount}x Loop
            </span>
            <button
              type="button"
              onClick={() => setRewatchCount(rewatchCount + 1)}
              className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-surface text-on-surface flex items-center justify-center font-bold border border-outline-variant transition-colors"
            >
              +
            </button>
            <span className="font-meta-tag text-[10px] text-secondary">
              (Strong training weight)
            </span>
          </div>
        </div>
      </div>

      {/* Episode / Chapter Progress Checklist */}
      {isEpisodic ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-meta-label text-meta-label uppercase text-on-surface tracking-wider font-semibold">
              {unitLabel} Checklist ({completedCount} / {totalUnits} Logged · {completionPct}%)
            </span>
            <div className="flex items-center gap-3 font-button-text text-button-text uppercase text-secondary">
              <button
                type="button"
                onClick={() => markAll(true)}
                className="hover:text-primary transition-colors"
              >
                Mark All
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => markAll(false)}
                className="hover:text-primary transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 max-h-56 overflow-y-auto p-1">
            {episodes.map((ep, idx) => (
              <button
                key={ep.number}
                type="button"
                onClick={() => toggleEpisode(idx)}
                className={`flex items-center gap-2 p-2.5 rounded-lg border font-meta-tag text-meta-tag uppercase text-left transition-all active:scale-95 ${
                  ep.completed
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container-low text-on-surface-variant border-outline-variant/60 hover:border-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {ep.completed ? 'check_box' : 'check_box_outline_blank'}
                </span>
                <span className="truncate">
                  {unitLabel} {ep.number}
                </span>
              </button>
            ))}
          </div>

          {dropOffPoint && dropOffPoint < totalUnits && (
            <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant flex items-center gap-2 text-on-surface-variant font-meta-tag text-[11px] uppercase">
              <span className="material-symbols-outlined text-gilded-amber text-[16px]">
                call_missed
              </span>
              <span>
                Drop-off point logged at {unitLabel.toLowerCase()} {dropOffPoint} of {totalUnits} ({completionPct}% depth).
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between font-meta-label text-meta-label uppercase text-on-surface">
            <span>Feature Completion Status</span>
            <span className="font-bold">{completionPct}%</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => markAll(true)}
              className={`px-4 py-2 rounded-full font-button-text text-button-text uppercase border transition-all ${
                completionPct === 100
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface-container-low text-on-surface-variant border-outline-variant'
              }`}
            >
              Finished Feature
            </button>
            <button
              type="button"
              onClick={() => markAll(false)}
              className={`px-4 py-2 rounded-full font-button-text text-button-text uppercase border transition-all ${
                completionPct === 0
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface-container-low text-on-surface-variant border-outline-variant'
              }`}
            >
              Not Finished
            </button>
          </div>
        </div>
      )}

      {/* Save Action Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-outline-variant/60">
        {saveSuccess ? (
          <span className="font-meta-tag text-meta-tag uppercase text-gilded-amber font-semibold animate-pulse flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            Telemetry synced to user taste profile
          </span>
        ) : (
          <span className="font-meta-tag text-meta-tag uppercase text-secondary">
            Persists to versioned recommendation grounding vector
          </span>
        )}

        <button
          type="button"
          onClick={saveProgress}
          disabled={saving}
          className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary-container text-on-primary font-button-text text-button-text uppercase shadow-md transition-all disabled:opacity-50 active:scale-95"
        >
          {saving ? 'Saving...' : 'Save Depth Signals'}
        </button>
      </div>
    </div>
  );
};
