import React, { useState, useEffect } from 'react';
import { Search, Film, Tv, BookOpen, Sparkles, ChevronRight, PlusCircle, Check } from 'lucide-react';
import { api } from '../api/client';
import { Link } from 'react-router-dom';

export const SearchCatalog = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loggedItems, setLoggedItems] = useState(new Set());

  useEffect(() => {
    fetchInitialCatalog();
    fetchLoggedItems();
  }, []);

  const fetchInitialCatalog = async () => {
    setLoading(true);
    try {
      const res = await api.get('/media/search?limit=30');
      setResults(res.data || []);
    } catch (err) {
      console.error('Failed to load catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoggedItems = async () => {
    try {
      const res = await api.get('/history');
      const ids = new Set((res.data || []).map((h) => h.media_item_id));
      setLoggedItems(ids);
    } catch (err) {
      console.error('Failed to fetch history ids:', err);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.get(`/media/search?q=${encodeURIComponent(query)}`);
      setResults(res.data || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMediaIcon = (type) => {
    switch (type) {
      case 'movie':
        return <Film className="w-3.5 h-3.5 text-[#0A84FF]" />;
      case 'tv':
        return <Tv className="w-3.5 h-3.5 text-[#5E5CE6]" />;
      case 'book':
        return <BookOpen className="w-3.5 h-3.5 text-[#FF9F0A]" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-[#30D158]" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 space-y-8">
      {/* Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Browse Seed Catalog
          </h1>
          <p className="text-sm text-apple-textSecondary mt-1">
            Search 20+ dense-embedded seed items or log new signals into your taste centroid.
          </p>
        </div>

        <form onSubmit={handleSearch} className="w-full md:w-80 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles, genres, themes..."
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white/[0.06] border border-white/15 text-xs text-white placeholder-apple-textTertiary focus:outline-none focus:border-apple-blue transition-colors"
          />
          <Search className="w-4 h-4 text-apple-textTertiary absolute left-3.5 top-3" />
        </form>
      </div>

      {/* Catalog Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="apple-card h-52 rounded-squircle-xl animate-pulse" />
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {results.map((item) => {
            const isLogged = loggedItems.has(item.id);
            return (
              <div
                key={item.id}
                className="apple-card p-6 rounded-squircle-xl flex flex-col justify-between group transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-white/[0.08] text-white border border-white/10">
                      {getMediaIcon(item.media_type)}
                      <span>{item.media_type}</span>
                    </span>
                    {item.raw_metadata?.year && (
                      <span className="text-xs text-apple-textTertiary font-mono">
                        {item.raw_metadata.year}
                      </span>
                    )}
                  </div>

                  <Link to={`/media/${item.id}`} className="block group/title">
                    <h3 className="text-base font-bold text-white group-hover/title:text-apple-blue transition-colors mb-1.5 flex items-center justify-between">
                      <span>{item.title}</span>
                      <ChevronRight className="w-4 h-4 text-apple-textTertiary group-hover/title:text-apple-blue group-hover/title:translate-x-1 transition-all" />
                    </h3>
                  </Link>

                  <p className="text-xs text-apple-textPrimary/80 line-clamp-2 leading-relaxed mb-3">
                    {item.synopsis}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {item.sub_genres?.slice(0, 2).map((sg, idx) => (
                      <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-apple-indigo/15 text-[#A5A3F6] border border-apple-indigo/25">
                        {sg}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-white/[0.08] flex items-center justify-between">
                  <Link
                    to={`/media/${item.id}`}
                    className="text-xs text-apple-blue hover:underline font-semibold flex items-center space-x-1"
                  >
                    <span>View & Log Depth</span>
                  </Link>

                  {isLogged ? (
                    <span className="inline-flex items-center space-x-1 text-[11px] text-apple-green font-mono">
                      <Check className="w-3.5 h-3.5" />
                      <span>In History</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-apple-textTertiary font-mono">
                      Not logged
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="apple-card p-12 rounded-squircle-2xl text-center max-w-md mx-auto space-y-3">
          <Search className="w-8 h-8 text-apple-textTertiary mx-auto" />
          <h3 className="text-base font-bold text-white">No Catalog Items Found</h3>
          <p className="text-xs text-apple-textSecondary">Try searching with broader terms like 'sci-fi', 'drama', or 'romance'.</p>
        </div>
      )}
    </div>
  );
};
