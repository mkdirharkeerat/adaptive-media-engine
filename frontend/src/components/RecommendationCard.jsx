import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, Sparkles, Film, Tv, BookOpen, ChevronRight, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';

export const RecommendationCard = ({ recommendation, onFeedbackSubmitted }) => {
  const { media_item, reasoning_text, cited_items } = recommendation;
  const [feedbackStatus, setFeedbackStatus] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFeedback = async (direction, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    setLoading(true);
    try {
      await api.post('/feedback', {
        media_item_id: media_item.id,
        direction: direction === 'more' ? 'more_like_this' : 'less_like_this',
      });
      setFeedbackStatus(direction);
      setFeedbackMsg(direction === 'more' ? 'Vector Nudged (+)' : 'Vector Nudged (-)');
      if (onFeedbackSubmitted) onFeedbackSubmitted(media_item.id, direction);
    } catch (err) {
      console.error('Feedback error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMediaIcon = (type) => {
    switch (type) {
      case 'movie':
        return <Film className="w-3 h-3 text-[#0A84FF]" />;
      case 'tv':
        return <Tv className="w-3 h-3 text-[#5E5CE6]" />;
      case 'book':
        return <BookOpen className="w-3 h-3 text-[#FF9F0A]" />;
      default:
        return <Sparkles className="w-3 h-3 text-[#30D158]" />;
    }
  };

  const year = media_item.raw_metadata?.year;
  const creator = media_item.raw_metadata?.director || media_item.raw_metadata?.creator || media_item.raw_metadata?.author;

  return (
    <div className="apple-card rounded-squircle-xl p-6 flex flex-col justify-between group overflow-hidden">
      <div>
        {/* Top Badges & Meta */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-black/5 dark:bg-white/[0.08] text-[var(--text-primary)] border border-[var(--border-color)]">
            {getMediaIcon(media_item.media_type)}
            <span>{media_item.media_type}</span>
          </span>
          <div className="flex items-center space-x-2 text-xs text-[var(--text-secondary)] font-mono">
            {year && <span>{year}</span>}
            {creator && <span>• {creator}</span>}
          </div>
        </div>

        {/* Title */}
        <Link to={`/media/${media_item.id}`} className="block group/title">
          <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-tight mb-2.5 flex items-center justify-between">
            <span className="group-hover/title:text-apple-blue transition-colors">{media_item.title}</span>
            <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover/title:text-apple-blue group-hover/title:translate-x-1 transition-all" />
          </h3>
        </Link>

        {/* Sub-genres & Themes */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {media_item.sub_genres?.slice(0, 2).map((sg, idx) => (
            <span key={idx} className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-apple-indigo/15 text-[#5856D6] dark:text-[#A5A3F6] border border-apple-indigo/25">
              {sg}
            </span>
          ))}
          {media_item.themes?.slice(0, 3).map((theme, idx) => (
            <span key={idx} className="text-[11px] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/[0.05] text-[var(--text-secondary)] border border-[var(--border-color)]">
              #{theme}
            </span>
          ))}
        </div>

        {/* Synopsis */}
        <p className="text-xs text-[var(--text-primary)]/90 line-clamp-3 mb-5 leading-relaxed font-normal">
          {media_item.synopsis}
        </p>

        {/* Grounded Apple Intelligence-style Reasoning Box */}
        <div className="apple-ai-shimmer p-4 rounded-squircle border border-[var(--border-color)] space-y-2.5 relative">
          <div className="flex items-start space-x-2">
            <Sparkles className="w-4 h-4 text-apple-green shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-apple-green font-mono block mb-1">
                Grounded Explanation
              </span>
              <p className="text-xs text-[var(--text-primary)] leading-relaxed font-medium">
                {reasoning_text}
              </p>
            </div>
          </div>

          {/* Citations Badges */}
          {cited_items && cited_items.length > 0 && (
            <div className="pt-2 border-t border-[var(--border-color)] flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-[var(--text-tertiary)] font-mono uppercase">Evidence:</span>
              {cited_items.map((cited) => (
                <span
                  key={cited.history_id}
                  className="inline-flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/[0.08] text-[var(--text-primary)] border border-[var(--border-color)]"
                >
                  <CheckCircle2 className="w-3 h-3 text-apple-green" />
                  <span className="font-semibold">{cited.title}</span>
                  {cited.rating && <span className="text-apple-orange font-mono">★{cited.rating}</span>}
                  {cited.rewatch_count > 0 && <span className="text-apple-indigo font-mono">({cited.rewatch_count}x)</span>}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="mt-5 pt-4 border-t border-[var(--border-color)] flex items-center justify-between text-xs">
        <Link
          to={`/media/${media_item.id}`}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium flex items-center space-x-1 transition-colors"
        >
          <span>Track Depth & Signals</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>

        {/* Online Similarity Feedback */}
        <div className="flex items-center space-x-1.5">
          {feedbackMsg && (
            <span className="text-[11px] text-apple-green font-mono mr-1.5 animate-pulse">
              {feedbackMsg}
            </span>
          )}
          <button
            onClick={(e) => handleFeedback('more', e)}
            disabled={loading || feedbackStatus === 'more'}
            className={`p-2 rounded-full border transition-all ${
              feedbackStatus === 'more'
                ? 'bg-apple-green text-black border-apple-green shadow-apple-glow'
                : 'bg-black/5 dark:bg-white/[0.06] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-color)] hover:bg-black/10 dark:hover:bg-white/[0.12]'
            }`}
            title="More like this (nudge taste vector)"
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => handleFeedback('less', e)}
            disabled={loading || feedbackStatus === 'less'}
            className={`p-2 rounded-full border transition-all ${
              feedbackStatus === 'less'
                ? 'bg-apple-red text-white border-apple-red'
                : 'bg-black/5 dark:bg-white/[0.06] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-color)] hover:bg-black/10 dark:hover:bg-white/[0.12]'
            }`}
            title="Less like this"
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
