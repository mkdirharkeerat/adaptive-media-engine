import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export const SearchCatalog = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loggedItems, setLoggedItems] = useState(new Set());
  const [mediaTypeFilter, setMediaTypeFilter] = useState('all');
  const [loggingId, setLoggingId] = useState(null);

  useEffect(() => {
    fetchInitialCatalog();
    fetchLoggedItems();
  }, []);

  const fetchInitialCatalog = async () => {
    setLoading(true);
    try {
      const res = await api.get('/media/search?limit=36');
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
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const endpoint = query.trim()
        ? `/media/search?q=${encodeURIComponent(query)}`
        : '/media/search?limit=36';
      const res = await api.get(endpoint);
      setResults(res.data || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const quickLog = async (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    setLoggingId(item.id);
    try {
      await api.post('/history', {
        media_item_id: item.id,
        completion_pct: 100,
        rewatch_count: 1,
        rating: 4.5,
      });
      setLoggedItems((prev) => new Set([...prev, item.id]));
    } catch (err) {
      console.error('Quick log failed:', err);
    } finally {
      setLoggingId(null);
    }
  };

  const filteredResults = results.filter((item) => {
    if (mediaTypeFilter === 'all') return true;
    return item.media_type === mediaTypeFilter;
  });

  return (
    <div className="w-full bg-surface min-h-screen">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 flex flex-col gap-10">
        {/* Ghost Search Header Area (Editorial Centered Layout) */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto w-full pt-4 space-y-4">
          <span className="font-meta-tag text-meta-tag uppercase text-gilded-amber tracking-widest font-semibold">
            ADAPTIVE MEDIA ENGINE · CATALOG
          </span>
          <h1 className="font-headline-lg text-4xl sm:text-5xl font-serif text-on-surface tracking-tight">
            Search Adaptive Media Engine
          </h1>
          <p className="font-body-md text-body-md text-secondary max-w-lg leading-relaxed">
            Search dense-embedded items across cinematic narratives, television series, and literary masterworks.
          </p>

          {/* Full-width Ghost Search Input */}
          <form onSubmit={handleSearch} className="w-full pt-4">
            <div className="relative flex items-center border-b-2 border-outline-variant focus-within:border-primary transition-colors py-2">
              <span className="material-symbols-outlined text-[24px] text-secondary mr-3 pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search movies, shows, books, directors, themes…"
                className="w-full bg-transparent font-serif italic text-xl sm:text-2xl text-on-surface placeholder:text-outline focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    fetchInitialCatalog();
                  }}
                  className="p-1 text-secondary hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>
          </form>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 pt-3">
            {[
              { id: 'all', label: 'All Media' },
              { id: 'movie', label: 'Movies' },
              { id: 'tv', label: 'TV Shows' },
              { id: 'book', label: 'Books' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMediaTypeFilter(tab.id)}
                className={`px-4 py-1.5 rounded-full font-meta-tag text-meta-tag uppercase transition-all ${
                  mediaTypeFilter === tab.id
                    ? 'bg-primary text-on-primary font-bold shadow-sm'
                    : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container border border-outline-variant/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Catalog Grid */}
        <div className="pt-6">
          <div className="flex items-center justify-between pb-4 border-b border-outline-variant/40 mb-6">
            <span className="font-meta-tag text-meta-tag uppercase text-on-surface-variant">
              Showing {filteredResults.length} Ingested Titles
            </span>
            <span className="font-meta-tag text-meta-tag uppercase text-secondary">
              Zero Engagement Traps
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-surface-container-low h-72 rounded-[2px] animate-pulse border border-outline-variant/40" />
              ))}
            </div>
          ) : filteredResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {filteredResults.map((item) => {
                const isLogged = loggedItems.has(item.id);
                const isLogging = loggingId === item.id;
                const type = item.media_type;
                const year = item.raw_metadata?.year;
                const posterUrl = item.raw_metadata?.poster_url;

                return (
                  <div
                    key={item.id}
                    className="group flex flex-col justify-between bg-surface-container-low p-2 rounded-[2px] border border-outline-variant/40 hover:shadow-tactile-hover transition-all duration-300 hover:-translate-y-1.5"
                  >
                    <Link to={`/media/${item.id}`} className="block relative aspect-[2/3] overflow-hidden bg-primary rounded-[2px] shadow-sm">
                      {/* Case Tag */}
                      <div className="absolute top-1.5 left-2 z-20 px-1.5 py-0.5 bg-obsidian-surface/90 text-linen-white font-meta-tag text-[9px] uppercase tracking-wider rounded-sm border border-white/10">
                        {type === 'movie' ? '4K UHD' : type === 'tv' ? 'TV SERIES' : 'HARDBACK'}
                      </div>

                      {posterUrl ? (
                        <img
                          src={posterUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col justify-between p-3 bg-stone-900 text-linen-white">
                          <span className="font-meta-tag text-[9px] text-gilded-amber uppercase">{type}</span>
                          <span className="font-serif italic text-sm text-center my-auto">{item.title}</span>
                          <span className="font-meta-tag text-[9px] text-stone-400">{year}</span>
                        </div>
                      )}

                      <div className="case-sheen absolute inset-0 pointer-events-none opacity-50"></div>
                      <div className="spine-fold-gradient absolute inset-y-0 left-0 w-3 pointer-events-none"></div>
                    </Link>

                    {/* Metadata & Quick Action Strip */}
                    <div className="flex flex-col pt-3 pb-1 px-1">
                      <Link to={`/media/${item.id}`}>
                        <h4 className="font-body-md text-body-md font-medium text-on-surface truncate group-hover:text-primary transition-colors">
                          {item.title}
                        </h4>
                      </Link>
                      <span className="font-meta-tag text-meta-tag uppercase text-on-surface-variant mt-0.5">
                        {type.toUpperCase()} {year && `· ${year}`}
                      </span>

                      {/* Add to History Action Pill */}
                      <button
                        type="button"
                        onClick={(e) => quickLog(e, item)}
                        disabled={isLogged || isLogging}
                        className={`mt-3 w-full py-1.5 px-3 rounded-full font-button-text text-[10px] uppercase flex items-center justify-center gap-1.5 transition-all ${
                          isLogged
                            ? 'bg-surface-container-high text-secondary border border-outline-variant/60 cursor-default'
                            : 'bg-primary hover:bg-primary-container text-on-primary shadow-sm active:scale-95'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {isLogged ? 'check' : 'add'}
                        </span>
                        <span>{isLogged ? 'In History' : isLogging ? 'Logging…' : 'Add To History'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center max-w-md mx-auto space-y-3">
              <span className="material-symbols-outlined text-secondary text-[40px]">
                search_off
              </span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-serif">
                No Results for "{query}"
              </h3>
              <p className="font-body-md text-body-md text-secondary">
                Try searching for related titles, genres (e.g. "sci-fi", "slow-burn"), or switch media type filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
