import React from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { PhysicalMediaCase3D } from './PhysicalMediaCase3D';

export const InspectorModal = ({ isOpen, onClose, recommendation, onFeedback }) => {
  if (!isOpen || !recommendation) return null;

  const { media_item, reasoning_text, cited_history_ids } = recommendation;
  const type = media_item.media_type;
  const year = media_item.raw_metadata?.year;
  const runtime = media_item.raw_metadata?.runtime ? `${media_item.raw_metadata.runtime}m` : null;
  const episodes = media_item.raw_metadata?.total_episodes ? `${media_item.raw_metadata.total_episodes} eps` : null;
  const pages = media_item.raw_metadata?.pages ? `${media_item.raw_metadata.pages}p` : null;

  const metaString = [type.toUpperCase(), year, runtime || episodes || pages].filter(Boolean).join(' · ');

  const handleFeedback = async (direction) => {
    try {
      await api.post('/feedback', {
        media_item_id: media_item.id,
        direction,
      });
      if (onFeedback) onFeedback(media_item.id, direction);
      onClose();
    } catch (err) {
      console.error('Feedback failed:', err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-obsidian-canvas/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-rise"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-glass-modal border border-outline-variant relative flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div>
            <span className="font-meta-tag text-meta-tag uppercase text-on-surface-variant">
              {metaString}
            </span>
            <h3 className="font-headline-md text-headline-md text-on-surface mt-1">
              {media_item.title}
            </h3>
          </div>
          <button
            aria-label="Close Inspector"
            onClick={onClose}
            className="p-2 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* 3D Physical Media Case Inspection */}
        <div className="w-full h-48 sm:h-56 bg-surface-container-lowest/60 rounded-xl overflow-hidden border border-outline-variant/30 flex items-center justify-center relative">
          <PhysicalMediaCase3D
            title={media_item.title}
            mediaType={type}
            year={year || '2024'}
            posterUrl={media_item.raw_metadata?.poster_url}
            affinity="0.94"
            className="w-full h-full"
          />
        </div>

        {/* Algorithmic Attribution Protocol Callout */}
        <div className="p-5 bg-surface-container rounded-xl flex flex-col gap-2 border border-outline-variant/50">
          <span className="font-meta-tag text-meta-tag uppercase text-gilded-amber flex items-center gap-1.5 font-bold tracking-wider">
            <span className="material-symbols-outlined text-[15px]">psychology</span>
            Algorithmic Attribution Protocol
          </span>
          <p className="font-headline-sm text-headline-sm italic text-on-surface leading-relaxed">
            "{reasoning_text}"
          </p>
        </div>

        {/* Cited Vector Inputs */}
        <div className="flex flex-col gap-2">
          <span className="font-meta-tag text-meta-tag uppercase text-on-surface-variant">
            Cited Vector Inputs ({cited_history_ids?.length || 1} Grounding Anchors)
          </span>
          <div className="flex flex-wrap gap-2">
            {(cited_history_ids && cited_history_ids.length > 0) ? (
              cited_history_ids.map((id, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-surface-container-high text-on-surface font-meta-tag text-meta-tag uppercase rounded-full border border-outline-variant/60"
                >
                  History Artifact #{id}
                </span>
              ))
            ) : (
              <span className="px-3 py-1 bg-surface-container-high text-on-surface font-meta-tag text-meta-tag uppercase rounded-full">
                Anchor Signal Match
              </span>
            )}
            {media_item.themes && media_item.themes.slice(0, 3).map((theme, i) => (
              <span
                key={`th-${i}`}
                className="px-3 py-1 bg-surface-container-low text-secondary font-meta-tag text-meta-tag uppercase rounded-full border border-outline-variant/40"
              >
                #{theme}
              </span>
            ))}
          </div>
        </div>

        {/* Synopsis snippet */}
        {media_item.synopsis && (
          <p className="font-body-md text-body-md text-on-surface-variant line-clamp-3">
            {media_item.synopsis}
          </p>
        )}

        {/* Modal Footer Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-outline-variant">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleFeedback('more')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-container text-on-primary font-button-text text-button-text uppercase rounded-full transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[14px]">thumb_up</span>
              <span>More Like This</span>
            </button>
            <button
              onClick={() => handleFeedback('less')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-surface-container-high hover:bg-surface-container text-on-surface font-button-text text-button-text uppercase rounded-full transition-all border border-outline-variant"
            >
              <span className="material-symbols-outlined text-[14px]">thumb_down</span>
              <span>Less Like This</span>
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <span className="font-meta-tag text-[10px] uppercase text-secondary">
              Confidence: 97.8%
            </span>
            <Link
              to={`/media/${media_item.id}`}
              className="font-button-text text-button-text uppercase text-gilded-amber hover:underline flex items-center gap-1"
            >
              <span>Full Media Record</span>
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
