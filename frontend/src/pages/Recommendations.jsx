import React, { useState, useEffect } from 'react';
import { Sparkles, Film, Tv, BookOpen, Layers, RefreshCw, ChevronDown, Sliders, ShieldCheck } from 'lucide-react';
import { api } from '../api/client';
import { RecommendationCard } from '../components/RecommendationCard';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export const Recommendations = () => {
  const { preferences } = useAuth();
  const [mediaType, setMediaType] = useState('all');
  const [batchNumber, setBatchNumber] = useState(1);
  const [recommendations, setRecommendations] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [contextMode, setContextMode] = useState('casual');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    fetchRecommendations(1, true);
  }, [mediaType]);

  const fetchRecommendations = async (batch = 1, reset = false) => {
    if (reset) {
      setLoading(true);
      setBatchNumber(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const typeParam = mediaType === 'all' ? '' : `&media_type=${mediaType}`;
      const res = await api.get(`/recommendations?batch=${batch}${typeParam}`);
      
      if (reset) {
        setRecommendations(res.data.items || []);
      } else {
        setRecommendations((prev) => [...prev, ...(res.data.items || [])]);
      }
      
      setBatchNumber(batch);
      setHasMore(res.data.has_more);
      setContextMode(res.data.context_mode || 'casual');
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

  const mediaTabs = [
    { id: 'all', label: 'All Media', icon: Layers },
    { id: 'movie', label: 'Movies', icon: Film },
    { id: 'tv', label: 'TV Shows', icon: Tv },
    { id: 'book', label: 'Books', icon: BookOpen },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-8">
      {/* Top Apple Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--border-color)]">
        <div>
          <div className="flex items-center space-x-2 text-xs text-apple-green font-mono mb-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>GROUNDED TASTE CENTROID • ZERO ENGAGEMENT TRAPS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Curated For Your Genuine Taste
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Grounded in your completion depth, rewatches, and explicit preference values.
          </p>
        </div>

        {/* Current Context Mode Badge */}
        <div className="flex items-center space-x-3">
          <div className="apple-card px-4 py-2 rounded-full flex items-center space-x-2.5">
            <span className="text-xs text-[var(--text-tertiary)] uppercase font-mono">Mode:</span>
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-apple-indigo/15 text-[#5856D6] dark:text-[#A5A3F6] border border-apple-indigo/30">
              {contextMode}
            </span>
          </div>

          <Link
            to="/settings"
            className="apple-card px-4 py-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center space-x-2 text-xs font-semibold transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-apple-blue" />
            <span>Values v{preferences?.version || 1}</span>
          </Link>
        </div>
      </div>

      {/* Segmented Media Type Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="apple-segmented-pill p-1 rounded-full flex items-center space-x-1">
          {mediaTabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = mediaType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setMediaType(tab.id)}
                className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-[var(--pill-active-bg)] text-[var(--pill-active-text)] shadow-apple-subtle font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => fetchRecommendations(1, true)}
          disabled={loading}
          className="p-2.5 rounded-full bg-black/5 dark:bg-white/[0.06] hover:bg-black/10 dark:hover:bg-white/[0.12] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          title="Refresh Feed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-apple-green' : ''}`} />
        </button>
      </div>

      {/* Recommendation Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="apple-card h-80 rounded-squircle-xl animate-pulse" />
          ))}
        </div>
      ) : recommendations.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendations.map((rec, idx) => (
              <RecommendationCard key={`${rec.media_item_id}-${idx}`} recommendation={rec} />
            ))}
          </div>

          {/* Fixed Batching (No Infinite Scroll) */}
          <div className="pt-8 pb-12 flex flex-col items-center justify-center border-t border-[var(--border-color)]">
            {hasMore ? (
              <div className="text-center">
                <button
                  onClick={loadNextBatch}
                  disabled={loadingMore}
                  className="px-8 py-3.5 rounded-full bg-black/5 dark:bg-white/[0.08] hover:bg-black/10 dark:hover:bg-white/[0.15] text-[var(--text-primary)] text-xs font-bold border border-[var(--border-color)] shadow-apple-subtle flex items-center space-x-2.5 transition-all disabled:opacity-50 active:scale-95"
                >
                  <span>{loadingMore ? 'Loading Next Batch...' : `Load Batch #${batchNumber + 1} (10 Items)`}</span>
                  <ChevronDown className="w-4 h-4 text-apple-green" />
                </button>
                <span className="text-[11px] text-[var(--text-tertiary)] font-mono block mt-2.5">
                  Delivered in fixed 10-item batches to prevent algorithmic session traps.
                </span>
              </div>
            ) : (
              <div className="text-center text-xs text-[var(--text-tertiary)] font-mono">
                ✓ You have reached the end of this recommendation batch.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="apple-card p-12 rounded-squircle-2xl text-center max-w-lg mx-auto space-y-4">
          <Sparkles className="w-10 h-10 text-[var(--text-tertiary)] mx-auto" />
          <h3 className="text-lg font-bold text-[var(--text-primary)]">No Candidates Matched</h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Adjust your explicit values selector or import more history to expand your recommendation candidate pool.
          </p>
          <Link
            to="/settings"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-apple-blue hover:bg-apple-blueHover text-white text-xs font-bold shadow-apple-blue-glow transition-all"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Adjust Values Selector</span>
          </Link>
        </div>
      )}
    </div>
  );
};
