import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Film, Tv, BookOpen, Sparkles, Tag, Layers, ArrowRight } from 'lucide-react';
import { api } from '../api/client';
import { DepthProgressTracker } from '../components/DepthProgressTracker';

export const ItemDetail = () => {
  const { id } = useParams();
  const [mediaItem, setMediaItem] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="apple-card h-96 rounded-squircle-2xl animate-pulse" />
      </div>
    );
  }

  if (!mediaItem) {
    return (
      <div className="max-w-md mx-auto my-16 apple-card p-8 rounded-squircle-2xl text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Item Not Found</h2>
        <p className="text-xs text-apple-textSecondary">The requested media item does not exist in the catalog.</p>
        <Link to="/" className="inline-block px-5 py-2 rounded-full bg-apple-green text-black font-bold text-xs">
          Return Home
        </Link>
      </div>
    );
  }

  const getMediaIcon = (type) => {
    switch (type) {
      case 'movie':
        return <Film className="w-4 h-4 text-[#0A84FF]" />;
      case 'tv':
        return <Tv className="w-4 h-4 text-[#5E5CE6]" />;
      case 'book':
        return <BookOpen className="w-4 h-4 text-[#FF9F0A]" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#30D158]" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-10 space-y-8">
      {/* Back Link */}
      <Link
        to="/"
        className="inline-flex items-center space-x-1.5 text-xs text-apple-textSecondary hover:text-white transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to Recommendations</span>
      </Link>

      {/* Media Overview Card */}
      <div className="apple-card p-8 rounded-squircle-2xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/[0.08] text-white border border-white/10">
            {getMediaIcon(mediaItem.media_type)}
            <span>{mediaItem.media_type}</span>
          </span>
          <div className="flex items-center space-x-3 text-xs text-apple-textSecondary font-mono">
            {mediaItem.raw_metadata?.year && <span>{mediaItem.raw_metadata.year}</span>}
            {mediaItem.raw_metadata?.director && <span>• Directed by {mediaItem.raw_metadata.director}</span>}
            {mediaItem.raw_metadata?.author && <span>• Written by {mediaItem.raw_metadata.author}</span>}
          </div>
        </div>

        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            {mediaItem.title}
          </h1>
          <p className="text-sm text-apple-textPrimary/90 leading-relaxed font-normal">
            {mediaItem.synopsis}
          </p>
        </div>

        {/* Sub-genres & Themes */}
        <div className="flex flex-wrap gap-2 pt-2">
          {mediaItem.sub_genres?.map((sg, idx) => (
            <span key={idx} className="text-xs font-semibold px-3 py-1 rounded-full bg-apple-indigo/20 text-[#A5A3F6] border border-apple-indigo/30">
              {sg}
            </span>
          ))}
          {mediaItem.themes?.map((t, idx) => (
            <span key={idx} className="text-xs px-2.5 py-1 rounded-full bg-white/[0.05] text-apple-textSecondary border border-white/[0.07]">
              #{t}
            </span>
          ))}
        </div>
      </div>

      {/* Depth & Completion Progress Tracker */}
      <DepthProgressTracker
        mediaItem={mediaItem}
        initialHistory={history}
        onHistoryUpdated={(updated) => setHistory(updated)}
      />
    </div>
  );
};
