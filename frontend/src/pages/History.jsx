import React, { useState, useEffect } from 'react';
import { History as HistoryIcon, Upload, Plus, Film, Tv, BookOpen, Star, RotateCcw, ChevronRight, Activity } from 'lucide-react';
import { api } from '../api/client';
import { HistoryImportModal } from '../components/HistoryImportModal';
import { Link } from 'react-router-dom';

export const History = () => {
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

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

  const getMediaIcon = (type) => {
    switch (type) {
      case 'movie':
        return <Film className="w-3 h-3 text-[#0A84FF]" />;
      case 'tv':
        return <Tv className="w-3 h-3 text-[#5E5CE6]" />;
      case 'book':
        return <BookOpen className="w-3 h-3 text-[#FF9F0A]" />;
      default:
        return <HistoryIcon className="w-3 h-3 text-[#30D158]" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-color)]">
        <div>
          <div className="flex items-center space-x-2 text-xs text-apple-green font-mono mb-1.5">
            <Activity className="w-4 h-4" />
            <span>DEPTH-WEIGHTED TASTE SIGNALS • GROUND TRUTH</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
            Media History & Completion Depth
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Every entry serves as evidence for your personalized recommendations.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-5 py-2.5 rounded-full bg-black/5 dark:bg-white/[0.08] hover:bg-black/10 dark:hover:bg-white/[0.15] text-[var(--text-primary)] text-xs font-bold border border-[var(--border-color)] shadow-apple-subtle flex items-center space-x-2 transition-all active:scale-95"
          >
            <Upload className="w-3.5 h-3.5 text-apple-blue" />
            <span>Import CSV / JSON</span>
          </button>

          <Link
            to="/search"
            className="px-5 py-2.5 rounded-full bg-apple-green hover:bg-apple-green/90 text-black text-xs font-bold shadow-apple-glow flex items-center space-x-2 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Media</span>
          </Link>
        </div>
      </div>

      {/* History Items List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="apple-card h-28 rounded-squircle animate-pulse" />
          ))}
        </div>
      ) : historyItems.length > 0 ? (
        <div className="space-y-3.5">
          {historyItems.map((item) => (
            <Link
              key={item.id}
              to={`/media/${item.media_item_id}`}
              className="apple-card p-5 rounded-squircle-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 group transition-all"
            >
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-squircle bg-black/5 dark:bg-white/[0.06] border border-[var(--border-color)] shrink-0">
                  {getMediaIcon(item.media_item?.media_type)}
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] font-mono">
                      {item.media_item?.media_type}
                    </span>
                    {item.rating && (
                      <span className="inline-flex items-center space-x-1 text-xs font-semibold text-apple-orange font-mono">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{item.rating}.0</span>
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-apple-blue transition-colors">
                    {item.media_item?.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[var(--text-secondary)]">
                    {item.rewatch_count > 0 && (
                      <span className="inline-flex items-center space-x-1 text-apple-indigo font-mono">
                        <RotateCcw className="w-3 h-3" />
                        <span>{item.rewatch_count}x rewatches</span>
                      </span>
                    )}
                    {item.drop_off_point && (
                      <span className="text-apple-orange font-mono">
                        • Dropped at #{item.drop_off_point}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress & Depth Pill */}
              <div className="flex items-center space-x-4 sm:space-x-6 justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-[var(--border-color)]">
                <div className="text-right">
                  <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-mono block">Completion Depth</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-black/10 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-apple-green h-full rounded-full transition-all"
                        style={{ width: `${item.completion_pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-apple-green font-mono">{item.completion_pct}%</span>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-apple-blue group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="apple-card p-12 rounded-squircle-2xl text-center max-w-md mx-auto space-y-4">
          <HistoryIcon className="w-10 h-10 text-[var(--text-tertiary)] mx-auto" />
          <h3 className="text-lg font-bold text-[var(--text-primary)]">No Media History Logged</h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Search our seed catalog or import a CSV/JSON file to bootstrap your recommendations.
          </p>
          <div className="flex items-center justify-center space-x-3 pt-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-4 py-2 rounded-full bg-black/5 dark:bg-white/[0.08] hover:bg-black/10 dark:hover:bg-white/[0.15] text-[var(--text-primary)] text-xs font-bold border border-[var(--border-color)] transition-all"
            >
              Import CSV
            </button>
            <Link
              to="/search"
              className="px-4 py-2 rounded-full bg-apple-green text-black text-xs font-bold shadow-apple-glow transition-all"
            >
              Browse Catalog
            </Link>
          </div>
        </div>
      )}

      {/* Import Modal */}
      <HistoryImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={fetchHistory}
      />
    </div>
  );
};
