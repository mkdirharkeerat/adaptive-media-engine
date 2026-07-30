import React, { useState } from 'react';
import { CheckCircle2, Circle, Star, RotateCcw, Activity } from 'lucide-react';
import { api } from '../api/client';

export const DepthProgressTracker = ({ mediaItem, initialHistory, onHistoryUpdated }) => {
  const mediaType = mediaItem.media_type;
  const isEpisodic = mediaType === 'tv' || mediaType === 'book';
  const unitLabel = mediaType === 'book' ? 'Chapter' : 'Episode';
  const totalUnits = mediaItem.raw_metadata?.total_episodes || mediaItem.raw_metadata?.total_chapters || 10;

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
  const completionPct = isEpisodic ? Math.round((completedCount / totalUnits) * 100) : (completedCount > 0 ? 100 : 0);
  const dropOffPoint = completedCount > 0 ? Math.max(...episodes.filter((e) => e.completed).map((e) => e.number)) : null;

  const estimatedScore = Math.min(
    100,
    Math.round(
      (completionPct * 0.45) +
      ((dropOffPoint ? (dropOffPoint / totalUnits) * 100 : 0) * 0.2) +
      ((rating / 5) * 100 * 0.2) +
      (Math.min(1, rewatchCount * 0.5) * 100 * 0.15)
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

  return (
    <div className="apple-card p-7 rounded-squircle-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--border-color)]">
        <div>
          <div className="flex items-center space-x-2">
            <h4 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">Depth & Completion Signals</h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-apple-green/15 text-apple-green border border-apple-green/25">
              XGBoost Input
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Treats each {unitLabel.toLowerCase()} as a data point to learn true preference over clickbait.
          </p>
        </div>

        {/* Calculated True Interest Score */}
        <div className="flex items-center space-x-3 bg-black/5 dark:bg-white/[0.06] px-4 py-2.5 rounded-squircle border border-[var(--border-color)]">
          <div className="text-right">
            <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-mono block">True Interest Signal</span>
            <span className="text-lg font-bold text-apple-green font-mono">{estimatedScore}%</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-apple-green/15 flex items-center justify-center text-apple-green border border-apple-green/25">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Ratings & Rewatches Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Star Rating */}
        <div className="bg-black/5 dark:bg-white/[0.04] p-4 rounded-squircle border border-[var(--border-color)]">
          <label className="text-xs font-semibold text-[var(--text-primary)] mb-2.5 block">
            Your Rating
          </label>
          <div className="flex items-center space-x-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(rating === star ? 0 : star)}
                className={`p-1 transition-transform active:scale-90 ${
                  star <= rating ? 'text-apple-orange' : 'text-black/20 dark:text-white/20 hover:text-black/40 dark:hover:text-white/40'
                }`}
              >
                <Star className="w-5 h-5 fill-current" />
              </button>
            ))}
            <span className="text-xs text-[var(--text-secondary)] font-mono ml-2">
              {rating > 0 ? `${rating}.0 / 5.0` : 'Unrated'}
            </span>
          </div>
        </div>

        {/* Rewatch Count */}
        <div className="bg-black/5 dark:bg-white/[0.04] p-4 rounded-squircle border border-[var(--border-color)]">
          <label className="text-xs font-semibold text-[var(--text-primary)] mb-2.5 block">
            Rewatch / Reread Multiplier
          </label>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setRewatchCount(Math.max(0, rewatchCount - 1))}
              className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/[0.08] hover:bg-black/20 dark:hover:bg-white/[0.15] text-[var(--text-primary)] flex items-center justify-center font-bold border border-[var(--border-color)] transition-colors"
            >
              -
            </button>
            <span className="text-sm font-bold text-[var(--text-primary)] font-mono">{rewatchCount}x</span>
            <button
              type="button"
              onClick={() => setRewatchCount(rewatchCount + 1)}
              className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/[0.08] hover:bg-black/20 dark:hover:bg-white/[0.15] text-[var(--text-primary)] flex items-center justify-center font-bold border border-[var(--border-color)] transition-colors"
            >
              +
            </button>
            <span className="text-[11px] text-[var(--text-secondary)]">
              (Strong training weight)
            </span>
          </div>
        </div>
      </div>

      {/* Episode / Chapter Checklist */}
      {isEpisodic && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[var(--text-primary)]">
              {unitLabel} Checklist ({completedCount} / {totalUnits} Finished)
            </span>
            <div className="space-x-3 text-xs">
              <button
                type="button"
                onClick={() => markAll(true)}
                className="text-apple-blue hover:underline font-medium"
              >
                Mark All
              </button>
              <span className="text-[var(--border-color)]">•</span>
              <button
                type="button"
                onClick={() => markAll(false)}
                className="text-[var(--text-secondary)] hover:underline font-medium"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 max-h-52 overflow-y-auto p-1">
            {episodes.map((ep, idx) => (
              <button
                key={ep.number}
                type="button"
                onClick={() => toggleEpisode(idx)}
                className={`flex items-center space-x-2 p-3 rounded-squircle-sm border text-xs text-left transition-all active:scale-[0.97] ${
                  ep.completed
                    ? 'bg-apple-green/15 border-apple-green/40 text-apple-green'
                    : 'bg-black/5 dark:bg-white/[0.03] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-black/20 dark:hover:border-white/20'
                }`}
              >
                {ep.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-apple-green shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-black/25 dark:text-white/30 shrink-0" />
                )}
                <span className="truncate font-medium">
                  {unitLabel} {ep.number}
                </span>
              </button>
            ))}
          </div>

          {dropOffPoint && dropOffPoint < totalUnits && (
            <div className="mt-3.5 p-3 rounded-squircle bg-apple-orange/10 border border-apple-orange/20 text-xs text-apple-orange flex items-center space-x-2">
              <RotateCcw className="w-4 h-4 shrink-0" />
              <span>
                Drop-off point captured at {unitLabel.toLowerCase()} {dropOffPoint} of {totalUnits} ({completionPct}% completion).
              </span>
            </div>
          )}
        </div>
      )}

      {/* Save Action */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)]">
        {saveSuccess ? (
          <span className="text-xs text-apple-green font-semibold animate-pulse">
            ✓ Signals synced to taste profile!
          </span>
        ) : (
          <span className="text-xs text-[var(--text-tertiary)]">
            Persists to your versioned recommendation profile.
          </span>
        )}

        <button
          type="button"
          onClick={saveProgress}
          disabled={saving}
          className="px-6 py-2.5 rounded-full bg-apple-green hover:bg-apple-green/90 text-black text-xs font-bold shadow-apple-glow transition-all disabled:opacity-50 active:scale-95"
        >
          {saving ? 'Saving...' : 'Save Depth Signals'}
        </button>
      </div>
    </div>
  );
};
