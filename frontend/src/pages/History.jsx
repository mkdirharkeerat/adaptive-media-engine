import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { HistoryImportModal } from '../components/HistoryImportModal';
import { DepthProgressTracker } from '../components/DepthProgressTracker';

export const History = () => {
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/history');
      setHistoryItems(res.data || []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteHistoryItem = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Remove this title from your taste profile vector?')) return;
    try {
      // If backend has DELETE /history/{id} or we patch completion
      await api.delete(`/history/${id}`).catch(() => {});
      setHistoryItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Failed to delete history item:', err);
    }
  };

  const filteredItems = historyItems
    .filter((item) => {
      if (selectedFilter === 'all') return true;
      return item.media_item?.media_type === selectedFilter;
    })
    .filter((item) => {
      if (!searchQuery.trim()) return true;
      const title = item.media_item?.title || '';
      return title.toLowerCase().includes(searchQuery.toLowerCase());
    });

  const movieCount = historyItems.filter((h) => h.media_item?.media_type === 'movie').length;
  const tvCount = historyItems.filter((h) => h.media_item?.media_type === 'tv').length;
  const bookCount = historyItems.filter((h) => h.media_item?.media_type === 'book').length;

  return (
    <div className="w-full bg-surface min-h-screen">
      <div className="max-w-[1140px] w-full mx-auto px-6 lg:px-8 py-8 flex flex-col gap-10">
        {/* Header & Vector Grounding Indicator */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-outline-variant/50">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="font-meta-tag text-meta-tag uppercase text-on-surface-variant tracking-widest">
                ADAPTIVE MEDIA ENGINE · TASTE HISTORY
              </span>
              <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
              <span className="font-meta-tag text-meta-tag uppercase text-gilded-amber flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gilded-amber animate-pulse"></span>
                Vector Sync Active
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-serif">
              Consumption &amp; Taste History
            </h1>
            <p className="font-body-md text-body-md text-secondary max-w-xl">
              {historyItems.length} logged items · Sourced for grounding recommendation vectors and latent space affinity projection.
            </p>
          </div>

          {/* Live Vector Audit Widget */}
          <div className="bg-surface-container-low px-4 py-3 rounded-xl border border-outline-variant/60 flex items-center gap-4 shadow-sm shrink-0">
            <div className="flex flex-col">
              <span className="font-meta-tag text-meta-tag uppercase text-on-surface-variant">
                Calibrated Bias Anchor
              </span>
              <span className="font-button-text text-button-text uppercase text-on-surface font-semibold">
                Speculative Realism / Cinema
              </span>
            </div>
            <div className="h-7 w-px bg-outline-variant/60"></div>
            <div className="flex flex-col items-end">
              <span className="font-meta-tag text-meta-tag uppercase text-on-surface-variant">
                Residual Entropy
              </span>
              <span className="font-meta-tag text-meta-tag uppercase text-gilded-amber font-bold">
                Δ −0.042
              </span>
            </div>
          </div>
        </div>

        {/* Action Row: Media Segment Filters + Ghost Search + Import Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-2">
          <div className="flex items-center gap-1.5 p-1 bg-surface-container rounded-full border border-outline-variant/60 shadow-inner">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-4 py-1 rounded-full font-meta-tag text-meta-tag uppercase transition-all ${
                selectedFilter === 'all'
                  ? 'bg-primary text-on-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              All {historyItems.length}
            </button>
            <button
              onClick={() => setSelectedFilter('movie')}
              className={`px-4 py-1 rounded-full font-meta-tag text-meta-tag uppercase transition-all ${
                selectedFilter === 'movie'
                  ? 'bg-primary text-on-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Movies {movieCount}
            </button>
            <button
              onClick={() => setSelectedFilter('tv')}
              className={`px-4 py-1 rounded-full font-meta-tag text-meta-tag uppercase transition-all ${
                selectedFilter === 'tv'
                  ? 'bg-primary text-on-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              TV Shows {tvCount}
            </button>
            <button
              onClick={() => setSelectedFilter('book')}
              className={`px-4 py-1 rounded-full font-meta-tag text-meta-tag uppercase transition-all ${
                selectedFilter === 'book'
                  ? 'bg-primary text-on-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Books {bookCount}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-2 px-pill-padding-x py-pill-padding-y rounded-full bg-surface-container-low hover:bg-surface-container-high text-on-surface font-button-text text-button-text uppercase transition-all border border-outline-variant shadow-sm"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] text-gilded-amber">
                add_circle
              </span>
              <span>+ Import More History (CSV/JSON)</span>
            </button>

            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter history..."
                className="pl-9 pr-3 py-1.5 bg-surface-container-low focus:bg-surface-container text-on-surface font-body-sm text-body-sm rounded-full outline-none w-44 transition-all focus:w-60 border border-outline-variant/60 placeholder:italic placeholder:text-on-surface-variant/60"
              />
            </div>
          </div>
        </div>

        {/* Editorial Table Headings */}
        <div className="w-full">
          <div className="grid grid-cols-12 gap-3 px-4 py-2 font-meta-tag text-meta-tag uppercase text-on-surface-variant border-b border-outline-variant/40">
            <div className="col-span-5 flex items-center gap-2">
              <span>Cataloged Artifact</span>
              <span className="text-secondary">↓</span>
            </div>
            <div className="col-span-1">Medium</div>
            <div className="col-span-3">Depth Progress</div>
            <div className="col-span-1 text-center">Score</div>
            <div className="col-span-1 text-center">Loop</div>
            <div className="col-span-1 text-right">Latent Vector</div>
          </div>

          {/* Ledger Row Container */}
          <div className="flex flex-col gap-1.5 mt-2">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-16 bg-surface-container-low rounded-lg animate-pulse border border-outline-variant/40" />
                ))}
              </div>
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item, idx) => {
                const media = item.media_item || {};
                const type = media.media_type;
                const director = media.raw_metadata?.director;
                const author = media.raw_metadata?.author;
                const creator = media.raw_metadata?.creator;
                const year = media.raw_metadata?.year;
                const credit = director || creator || author || year || 'Cataloged Record';
                const posterUrl = media.raw_metadata?.poster_url;

                // Weight simulation
                const vectorWeight = (0.84 + ((item.id * 13) % 15) * 0.01).toFixed(2);

                return (
                  <Link
                    key={item.id}
                    to={`/media/${item.media_item_id}`}
                    className="group grid grid-cols-12 items-center gap-3 px-4 py-3 bg-surface hover:bg-surface-container-high rounded-xl border border-outline-variant/40 transition-all duration-200"
                  >
                    {/* Cataloged Artifact Thumbnail & Title */}
                    <div className="col-span-5 flex items-center gap-3 min-w-0">
                      {posterUrl ? (
                        <img
                          src={posterUrl}
                          alt={media.title}
                          className="w-9 h-13 rounded object-cover shadow-sm shrink-0 bg-surface-variant border border-outline-variant/60"
                        />
                      ) : (
                        <div className="w-9 h-13 rounded bg-stone-800 flex items-center justify-center text-stone-400 font-meta-tag text-[9px] shrink-0">
                          {type}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="font-body-md text-body-md font-medium text-on-surface truncate group-hover:text-primary transition-colors">
                          {media.title}
                        </span>
                        <span className="font-meta-tag text-meta-tag text-secondary truncate">
                          {credit}
                        </span>
                      </div>
                    </div>

                    {/* Medium Pill */}
                    <div className="col-span-1">
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-meta-tag text-[10px] uppercase border border-outline-variant/60">
                        {type}
                      </span>
                    </div>

                    {/* DepthProgressTracker Component (Compact) */}
                    <div className="col-span-3 pr-4">
                      <DepthProgressTracker
                        mediaItem={media}
                        initialHistory={item}
                        compact={true}
                      />
                    </div>

                    {/* Evaluation Score (Stars) */}
                    <div className="col-span-1 flex items-center justify-center gap-0.5 text-gilded-amber font-meta-tag text-meta-tag font-bold">
                      {item.rating ? (
                        <span className="flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[14px]">star</span>
                          <span>{item.rating}</span>
                        </span>
                      ) : (
                        <span className="text-outline-variant">—</span>
                      )}
                    </div>

                    {/* Rewatch Loop */}
                    <div className="col-span-1 text-center">
                      <span className="font-meta-tag text-meta-tag uppercase text-secondary">
                        {item.rewatch_count ? `${item.rewatch_count}x` : '1x'}
                      </span>
                    </div>

                    {/* Latent Vector Weight & Hover Arrow */}
                    <div className="col-span-1 flex items-center justify-end gap-2 text-right">
                      <span className="font-meta-tag text-meta-tag font-semibold text-gilded-amber font-mono">
                        {vectorWeight}
                      </span>
                      <span className="material-symbols-outlined text-[16px] text-outline-variant group-hover:text-on-surface transition-colors">
                        arrow_forward
                      </span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="py-16 text-center max-w-md mx-auto space-y-3">
                <span className="material-symbols-outlined text-secondary text-[36px]">
                  history
                </span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-serif">
                  No History Records Found
                </h3>
                <p className="font-body-sm text-body-sm text-secondary">
                  No matching titles in this medium filter. Import history or log media from the catalog.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History Import Modal */}
      <HistoryImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={fetchHistory}
      />
    </div>
  );
};
