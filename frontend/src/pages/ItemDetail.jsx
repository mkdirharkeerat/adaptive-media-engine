import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { DepthProgressTracker } from '../components/DepthProgressTracker';

export const ItemDetail = () => {
  const { id } = useParams();
  const [mediaItem, setMediaItem] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedbackSent, setFeedbackSent] = useState(null);

  useEffect(() => {
    fetchItem();
  }, [id]);

  const fetchItem = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/media/${id}`);
      setMediaItem(res.data);

      try {
        const hRes = await api.get('/history');
        const match = hRes.data.find((h) => h.media_item_id === parseInt(id));
        if (match) setHistory(match);
      } catch (hErr) {
        console.error('Failed to fetch history match', hErr);
      }
    } catch (err) {
      console.error('Failed to load item:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (direction) => {
    try {
      await api.post('/feedback', {
        media_item_id: mediaItem.id,
        direction,
      });
      setFeedbackSent(direction);
      setTimeout(() => setFeedbackSent(null), 3000);
    } catch (err) {
      console.error('Feedback failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-surface-container-low h-96 rounded-2xl animate-pulse border border-outline-variant/50" />
      </div>
    );
  }

  if (!mediaItem) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-surface-container rounded-2xl text-center space-y-4 border border-outline-variant">
        <span className="material-symbols-outlined text-[48px] text-secondary">
          error_outline
        </span>
        <h2 className="font-headline-md text-headline-md text-on-surface font-serif">
          Record Not Found
        </h2>
        <p className="font-body-md text-body-md text-secondary">
          The requested media item does not exist in the Adaptive Media Engine database.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-2.5 rounded-full bg-primary text-on-primary font-button-text text-button-text uppercase shadow-sm hover:bg-primary-container transition-all"
        >
          Return to Recommendations
        </Link>
      </div>
    );
  }

  const type = mediaItem.media_type;
  const year = mediaItem.raw_metadata?.year;
  const director = mediaItem.raw_metadata?.director;
  const creator = mediaItem.raw_metadata?.creator;
  const author = mediaItem.raw_metadata?.author;
  const credit = director ? `Directed by ${director}` : creator ? `Created by ${creator}` : author ? `Written by ${author}` : null;
  const runtime = mediaItem.raw_metadata?.runtime ? `~${mediaItem.raw_metadata.runtime}M` : null;
  const episodes = mediaItem.raw_metadata?.total_episodes ? `${mediaItem.raw_metadata.total_episodes} EPISODES` : null;
  const pages = mediaItem.raw_metadata?.pages ? `${mediaItem.raw_metadata.pages} PAGES` : null;
  const posterUrl = mediaItem.raw_metadata?.poster_url;

  const formatText = [
    type === 'tv' ? 'TV SERIES' : type === 'book' ? 'LITERARY WORK' : 'CINEMATIC FEATURE',
    episodes || runtime || pages,
    year,
  ].filter(Boolean).join(' • ');

  return (
    <section className="w-full max-w-7xl mx-auto px-6 lg:px-12 pt-6 pb-24">
      {/* Back Link Bar */}
      <div className="flex items-center justify-between pb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-button-text text-button-text uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors group"
        >
          <span className="material-symbols-outlined text-[18px] transition-transform group-hover:-translate-x-1">
            arrow_back
          </span>
          <span>Return to Recommendations</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="font-meta-tag text-meta-tag uppercase text-on-surface-variant bg-surface-container px-3 py-1 rounded-full border border-outline-variant/60">
            Catalog ID #{mediaItem.id.toString().padStart(4, '0')}
          </span>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* Left Column: Case Art & Immediate Controls */}
        <div className="lg:col-span-4 xl:col-span-4 flex flex-col items-center lg:items-start">
          <div className="relative w-full max-w-[360px] group">
            {/* Ambient shadow behind cover */}
            <div className="absolute -inset-2 bg-obsidian-surface/10 rounded-lg blur-2xl transform transition-all group-hover:scale-105 pointer-events-none"></div>

            {/* Physical Case Frame with tactile 2px soft edges */}
            <div className="relative w-full aspect-[2/3] rounded-[2px] overflow-hidden shadow-tactile-case bg-primary border border-outline-variant/60 transition-transform duration-500 ease-out group-hover:-translate-y-1">
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt={mediaItem.title}
                  className="w-full h-full object-cover filter contrast-105"
                />
              ) : (
                <div className="w-full h-full flex flex-col justify-between p-6 bg-gradient-to-b from-stone-800 to-stone-950 text-linen-white">
                  <span className="font-meta-tag text-xs text-gilded-amber uppercase tracking-widest">
                    {type}
                  </span>
                  <div className="my-auto text-center">
                    <span className="font-headline-md text-xl italic font-serif block">
                      {mediaItem.title}
                    </span>
                  </div>
                  <span className="font-meta-tag text-xs text-stone-400">
                    {year || 'CATALOG'}
                  </span>
                </div>
              )}

              {/* Physical spine overlay subtle gradient highlight */}
              <div className="spine-fold-gradient absolute inset-0 pointer-events-none w-8"></div>
              <div className="case-sheen absolute inset-0 pointer-events-none opacity-40"></div>
            </div>
          </div>

          {/* Format & Platform Pill */}
          <div className="mt-6 w-full max-w-[360px] flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-container rounded-full text-on-surface-variant border border-outline-variant/60">
              <span className="w-1.5 h-1.5 rounded-full bg-gilded-amber"></span>
              <span className="font-meta-tag text-meta-tag uppercase">
                {formatText}
              </span>
            </div>
            <span className="font-meta-tag text-meta-tag uppercase text-secondary">
              {type === 'movie' ? '4K HDR' : type === 'tv' ? 'DOLBY' : 'PRINT'}
            </span>
          </div>

          {/* Action Pill Buttons */}
          <div className="mt-5 w-full max-w-[360px] grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleFeedback('more')}
              className="w-full py-3 px-4 rounded-full bg-primary text-on-primary font-button-text text-button-text uppercase tracking-widest shadow-md hover:bg-primary-container transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">thumb_up</span>
              <span>{feedbackSent === 'more' ? 'Nudged closer' : 'More Like This'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleFeedback('less')}
              className="w-full py-3 px-4 rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-button-text text-button-text uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-outline-variant active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">thumb_down</span>
              <span>{feedbackSent === 'less' ? 'Nudged away' : 'Less Like This'}</span>
            </button>
          </div>

          {/* Auxiliary Engine Details */}
          <div className="mt-8 w-full max-w-[360px] pt-6 border-t border-outline-variant/40 space-y-3">
            <div className="flex justify-between items-baseline font-meta-tag text-meta-tag">
              <span className="text-on-surface-variant uppercase">CANONICAL ID</span>
              <span className="text-on-surface font-medium font-mono">{mediaItem.external_id || `INT-${mediaItem.id}`}</span>
            </div>
            <div className="flex justify-between items-baseline font-meta-tag text-meta-tag">
              <span className="text-on-surface-variant uppercase">LATENT DIMENSIONS</span>
              <span className="text-on-surface font-medium font-mono">1,536-EMBEDDINGS</span>
            </div>
            <div className="flex justify-between items-baseline font-meta-tag text-meta-tag">
              <span className="text-on-surface-variant uppercase">LOCAL COLD STORAGE</span>
              <span className="text-on-surface font-medium font-mono">PGVECTOR / INDEXED</span>
            </div>
          </div>
        </div>

        {/* Right Column: Editorial Narrative & Telemetry */}
        <div className="lg:col-span-8 xl:col-span-8 flex flex-col space-y-10">
          {/* Header & Classification */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="font-meta-label text-meta-label uppercase text-gilded-amber font-semibold">
                COLLECTION ENTRY #{mediaItem.id.toString().padStart(3, '0')}
              </span>
              <span className="text-secondary">•</span>
              <span className="font-meta-tag text-meta-tag uppercase text-on-surface-variant">
                RELEASE: {year || 'CATALOG'}
              </span>
            </div>

            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-serif">
              {mediaItem.title}
            </h1>

            {/* Monospace Metadata Line */}
            {credit && (
              <div className="font-meta-tag text-meta-tag uppercase tracking-wider text-on-surface-variant pt-1 pb-1 leading-relaxed">
                {credit.toUpperCase()}
              </div>
            )}

            {/* Thematic Tags */}
            {mediaItem.themes && mediaItem.themes.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {mediaItem.themes.map((theme, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full bg-surface-container font-meta-tag text-meta-tag uppercase text-on-surface-variant border border-outline-variant/60"
                  >
                    #{theme}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Synopsis Quote Card */}
          <div className="relative bg-surface-container-low p-6 lg:p-8 rounded-2xl border border-outline-variant/60">
            <div className="text-gilded-amber absolute top-4 right-6 select-none opacity-30 font-headline-lg text-5xl font-serif">
              “
            </div>
            <p className="font-body-lg text-body-lg text-on-surface leading-relaxed max-w-3xl font-sans">
              {mediaItem.synopsis || 'No synopsis cataloged for this item.'}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-6 font-meta-tag text-meta-tag uppercase text-on-surface-variant border-t border-outline-variant/40 pt-4">
              {runtime && <span>RUN TIME: {runtime}</span>}
              {episodes && <span>LENGTH: {episodes}</span>}
              <span>ENCODING: PGVECTOR L2 DISTANCE</span>
            </div>
          </div>

          {/* Interactive Depth & History Tracker Component */}
          <DepthProgressTracker
            mediaItem={mediaItem}
            initialHistory={history}
            onHistoryUpdated={(newH) => setHistory(newH)}
          />
        </div>
      </div>
    </section>
  );
};
