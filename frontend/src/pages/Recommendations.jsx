import React, { useMemo, useState, useEffect } from 'react';
import { api } from '../api/client';
import { RecommendationCard } from '../components/RecommendationCard';
import { InspectorModal } from '../components/InspectorModal';
import { ModeFormatFilters } from '../components/ModeFormatFilters';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { genresForMode, MODE_SHELF_TITLES } from '../data/taxonomy';

export const Recommendations = () => {
  const { preferences } = useAuth();
  const defaultMode = preferences?.content_modes?.includes('non-fiction') && !preferences?.content_modes?.includes('fiction')
    ? 'non-fiction'
    : preferences?.content_modes?.[0] || 'fiction';
  const [contentMode, setContentMode] = useState(defaultMode);
  const [mediaType, setMediaType] = useState('all');
  const [selectedTheme, setSelectedTheme] = useState('all');
  const [batchNumber, setBatchNumber] = useState(1);
  const [recommendations, setRecommendations] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [contextMode, setContextMode] = useState('casual');
  const [depthRatio, setDepthRatio] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [inspectedRec, setInspectedRec] = useState(null);

  const [historyCount, setHistoryCount] = useState(0);
  const [anchorTitles, setAnchorTitles] = useState([]);

  const availableThemes = useMemo(
    () => [{ id: 'all', label: 'All genres' }, ...genresForMode(contentMode)],
    [contentMode]
  );

  useEffect(() => {
    setSelectedTheme('all');
  }, [contentMode]);

  useEffect(() => {
    fetchRecommendations(1, true);
    fetchAnchorSignals();
  }, [mediaType, contentMode, selectedTheme]);

  const fetchAnchorSignals = async () => {
    try {
      const res = await api.get('/history');
      if (res.data && res.data.length > 0) {
        setHistoryCount(res.data.length);
        setAnchorTitles(res.data.slice(0, 4));
      }
    } catch (err) {
      console.error('Failed to load anchor history', err);
    }
  };

  const fetchRecommendations = async (batch = 1, reset = false) => {
    if (reset) {
      setLoading(true);
      setBatchNumber(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams({ batch: String(batch) });
      if (mediaType && mediaType !== 'all') params.set('media_type', mediaType);
      if (contentMode && contentMode !== 'all') params.set('content_mode', contentMode);
      if (selectedTheme && selectedTheme !== 'all') params.set('genre', selectedTheme);
      const res = await api.get(`/recommendations?${params.toString()}`);
      const newItems = res.data.items || [];

      if (reset) {
        setRecommendations(newItems);
      } else {
        setRecommendations((prev) => [...prev, ...newItems]);
      }

      setBatchNumber(batch);
      setHasMore(res.data.has_more);
      setContextMode(res.data.context_mode || 'casual');
      if (typeof res.data.depth_ratio === 'number') {
        setDepthRatio(res.data.depth_ratio);
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadNextBatch = () => {
    if (!hasMore || loadingMore) return;
    fetchRecommendations(batchNumber + 1, false);
  };

  const handleInspect = (rec) => {
    setInspectedRec(rec);
  };

  const handleFeedback = (mediaItemId, direction) => {
    // Optionally refine local state or notify
    console.log(`Vector nudged ${direction} for item #${mediaItemId}`);
  };

  const filteredRecs = recommendations;
  const depthPct = Math.round((depthRatio || 0) * 100);

  return (
    <div className="w-full bg-surface min-h-screen">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 w-full pt-8 pb-24">
        {/* Top Provenance & Depth Progress Tracker Banner (Section 6.3) */}
        <div className="pt-2 pb-10 flex flex-col gap-6">
          <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/60 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
            <div className="flex flex-col gap-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gilded-amber animate-pulse"></span>
                <span className="font-meta-tag text-meta-tag uppercase text-on-surface-variant tracking-wider">
                  Provenance Pipeline · Deterministic Feed
                </span>
              </div>
              <p className="font-body-md text-body-md text-on-surface">
                Synthesized from <span className="font-semibold text-on-surface">{historyCount} verified interactions</span> across visual and textual logs. Zero engagement algorithms, zero sponsored bias.
              </p>
            </div>

            {/* Depth Progress Ratio Widget */}
            <div className="flex items-center gap-6 bg-surface p-4 rounded-xl border border-outline-variant/50 shadow-sm shrink-0">
              <div className="flex flex-col">
                <span className="font-meta-tag text-meta-tag uppercase text-on-surface-variant">
                  Batch Depth Ratio
                </span>
                <span className="font-headline-sm text-headline-sm font-normal text-on-surface mt-0.5 font-serif">
                  {depthRatio.toFixed(2)} <span className="text-body-sm font-body-sm text-secondary">/ 1.00</span>
                </span>
              </div>
              <div className="w-28 flex flex-col gap-1.5">
                <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full transition-all duration-700" style={{ width: `${depthPct}%` }}></div>
                </div>
                <span className="font-meta-tag text-[9px] uppercase tracking-widest text-gilded-amber text-right font-bold">
                  {depthPct >= 75 ? 'HIGH DENSITY' : depthPct >= 40 ? 'CALIBRATING' : 'SPARSE'}
                </span>
              </div>
              <div className="hidden sm:flex flex-col text-right pl-4 border-l border-outline-variant/40">
                <span className="font-meta-tag text-meta-tag uppercase text-on-surface-variant">
                  Context Horizon
                </span>
                <span className="font-meta-tag text-meta-tag text-secondary mt-1 uppercase font-semibold">
                  {contextMode} MODE
                </span>
              </div>
            </div>
          </div>

          {/* Feed Headline & Media Segment Filters */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4">
            <div className="flex flex-col">
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-serif">
                Your Next Picks
              </h1>
              <p className="font-body-md text-body-md text-secondary mt-1">
                Batch {batchNumber} · grounded in explicit values v{preferences?.version || 1} &amp; {historyCount} logged artifacts
              </p>
            </div>

            <ModeFormatFilters
              contentMode={contentMode}
              onContentMode={setContentMode}
              mediaType={mediaType}
              onMediaType={setMediaType}
            />
          </div>

          {/* Sub-Genre Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-2 px-2">
            {availableThemes.map((th) => (
              <button
                key={th.id}
                onClick={() => setSelectedTheme(th.id)}
                className={`shrink-0 px-3.5 py-1 rounded-full font-meta-tag text-meta-tag uppercase transition-all ${
                  selectedTheme === th.id
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface border border-outline-variant/40'
                }`}
              >
                {th.label}
              </button>
            ))}
          </div>
        </div>

        {/* MAIN SHELF: Current Batch Recommendations */}
        <div className="flex flex-col gap-4 mt-4">
          {/* Shelf Eyebrow & Thematic Title */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-outline-variant/40 pb-3">
            <div className="flex items-baseline gap-3">
              <span className="font-meta-tag text-meta-tag uppercase text-gilded-amber tracking-widest font-bold">
                BATCH #{batchNumber} · VECTOR DEPTH {depthRatio.toFixed(2)}
              </span>
              <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
              <h2 className="font-headline-md text-headline-md italic text-on-surface font-serif">
                {selectedTheme === 'all'
                  ? 'Contemplative pacing, existential dread & speculative worlds'
                  : `Curated shelf · ${selectedTheme}`}
              </h2>
            </div>
            <span className="font-meta-tag text-meta-tag uppercase text-secondary">
              {filteredRecs.length} CANDIDATES DISPLAYED
            </span>
          </div>

          {/* Physical Baseline Shelf Container */}
          <div className="relative w-full pt-6 pb-2">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="bg-surface-container-low h-72 rounded-[2px] animate-pulse border border-outline-variant/40" />
                ))}
              </div>
            ) : filteredRecs.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 relative z-10 items-end">
                  {filteredRecs.map((rec, idx) => (
                    <RecommendationCard
                      key={`${rec.media_item_id}-${idx}`}
                      recommendation={rec}
                      index={idx}
                      onInspect={handleInspect}
                      onFeedback={handleFeedback}
                    />
                  ))}
                </div>

                {/* The Physical Shelf Ledge: Hairline bar with downward soft shadow */}
                <div className="shelf-ledge mt-4"></div>
                <div className="shelf-underplate"></div>
              </>
            ) : (
              <div className="py-20 text-center max-w-lg mx-auto space-y-4">
                <span className="material-symbols-outlined text-secondary text-[40px]">
                  shelves
                </span>
                <h3 className="font-headline-md text-headline-md text-on-surface font-serif">
                  Adaptive Media Engine Shelf is Calm
                </h3>
                <p className="font-body-md text-body-md text-secondary">
                  Adjust your explicit values boundaries or log additional history to expand the candidate matrix.
                </p>
                <Link
                  to="/settings"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-on-primary font-button-text text-button-text uppercase shadow-sm hover:bg-primary-container transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  <span>Adjust Values Selector</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Secondary Shelf: Anchor Titles Driving Current Matrix */}
        {anchorTitles.length > 0 && (
          <div className="flex flex-col gap-4 mt-16">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-3">
                <span className="font-meta-tag text-meta-tag uppercase text-on-surface-variant tracking-widest font-bold">
                  SOURCE EMBEDDINGS · PRIOR CONSUMPTION
                </span>
                <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                <h2 className="font-headline-md text-headline-md italic text-on-surface font-serif">
                  Anchor titles driving current matrix
                </h2>
              </div>
              <span className="font-meta-tag text-meta-tag uppercase text-secondary">
                PROVENANCE WEIGHT: 0.94
              </span>
            </div>

            <div className="p-6 bg-surface-container rounded-xl border border-outline-variant/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
              <div className="flex items-center gap-3 flex-wrap">
                {anchorTitles.map((anchor) => (
                  <Link
                    key={anchor.id}
                    to={`/media/${anchor.media_item_id}`}
                    className="flex items-center gap-2 px-3.5 py-1.5 bg-surface-bright rounded-lg border border-outline-variant/60 shadow-sm hover:border-on-surface transition-all group"
                  >
                    <span className="font-meta-tag text-[9px] uppercase text-gilded-amber font-bold">
                      {anchor.rating ? `${anchor.rating}★` : 'LOGGED'}
                    </span>
                    <span className="font-body-md text-body-md font-medium text-on-surface group-hover:text-primary transition-colors">
                      {anchor.media_item?.title || `Artifact #${anchor.media_item_id}`}
                    </span>
                  </Link>
                ))}
              </div>

              <div className="flex items-center gap-3 shrink-0 font-meta-tag text-[10px] uppercase text-on-surface-variant">
                <span>Centroid Dispersion: 0.042</span>
                <span className="w-px h-3 bg-outline-variant"></span>
                <span>Exploration Bias: Minimal</span>
              </div>
            </div>
          </div>
        )}

        {/* Fixed-Batch Pagination Area (Anti-Infinite-Scroll Mandate) */}
        <div className="mt-20 flex flex-col items-center justify-center gap-3">
          {hasMore ? (
            <button
              onClick={loadNextBatch}
              disabled={loadingMore}
              className="px-8 py-3.5 bg-primary text-on-primary font-button-text text-button-text uppercase hover:bg-primary-container rounded-full transition-all shadow-md flex items-center gap-2 group disabled:opacity-50 active:scale-95"
            >
              <span>{loadingMore ? 'Synthesizing Next Batch...' : `Load Next Batch (Batch ${batchNumber + 1})`}</span>
              <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </button>
          ) : (
            <div className="px-6 py-2.5 rounded-full bg-surface-container font-button-text text-button-text uppercase text-secondary border border-outline-variant">
              ✓ You have reached the terminal batch of this evaluation cycle
            </div>
          )}

          <div className="flex items-center gap-2 font-meta-tag text-meta-tag uppercase text-secondary mt-1">
            <span className="material-symbols-outlined text-[15px] text-gilded-amber">
              lock_clock
            </span>
            <span>Fixed 10-item batch · Architecturally excludes infinite scroll</span>
          </div>
        </div>
      </div>

      {/* Inspector Modal */}
      <InspectorModal
        isOpen={!!inspectedRec}
        recommendation={inspectedRec}
        onClose={() => setInspectedRec(null)}
        onFeedback={handleFeedback}
      />
    </div>
  );
};
