import React, { useState } from 'react';
import { api } from '../api/client';

export const HistoryImportModal = ({ isOpen, onClose, onImportSuccess }) => {
  if (!isOpen) return null;

  const [rawText, setRawText] = useState('');
  const [file, setFile] = useState(null);
  const [detectedFormat, setDetectedFormat] = useState('json');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successCount, setSuccessCount] = useState(null);

  const sampleJson = [
    {
      title: "Interstellar",
      media_type: "movie",
      rating: 5.0,
      completion_pct: 100,
      rewatch_count: 2
    },
    {
      title: "Severance",
      media_type: "tv",
      rating: 5.0,
      completion_pct: 100,
      rewatch_count: 3
    },
    {
      title: "Exhalation",
      media_type: "book",
      rating: 4.5,
      completion_pct: 100,
      rewatch_count: 1
    }
  ];

  const detectFormatFromContent = (content, fileName = '') => {
    const lower = content.toLowerCase();
    const nameLower = fileName.toLowerCase();

    if (nameLower.includes('letterboxd') || lower.includes('letterboxd uri') || lower.includes('film name')) {
      return 'letterboxd';
    }
    if (nameLower.includes('goodreads') || lower.includes('book id') || lower.includes('my rating')) {
      return 'goodreads';
    }
    if (nameLower.includes('steam') || lower.includes('steamid') || lower.includes('appid')) {
      return 'steam';
    }
    if (content.trim().startsWith('[') || content.trim().startsWith('{')) {
      return 'json';
    }
    return 'csv';
  };

  const handleFileUpload = (e) => {
    const uploaded = e.target.files[0];
    if (!uploaded) return;
    setFile(uploaded);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      setRawText(content);
      const fmt = detectFormatFromContent(content, uploaded.name);
      setDetectedFormat(fmt);
    };
    reader.readAsText(uploaded);
  };

  const handleImport = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessCount(null);

    try {
      let payload = {};
      if (detectedFormat === 'json') {
        let parsed = [];
        try {
          parsed = JSON.parse(rawText);
        } catch (jsonErr) {
          throw new Error('Invalid JSON format. Please verify JSON syntax or insert sample data.');
        }
        if (!Array.isArray(parsed)) {
          throw new Error('JSON root must be an array of media history objects.');
        }
        payload = { items: parsed, file_format: 'json' };
      } else {
        // Simple client-side parse or send as raw items
        // We parse CSV lines if format is CSV/Letterboxd/Goodreads
        const lines = rawText.trim().split('\n');
        const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
        const items = lines.slice(1).map((line) => {
          const vals = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
          const title = vals[0] || 'Unknown Title';
          return {
            title,
            media_type: detectedFormat === 'goodreads' ? 'book' : 'movie',
            rating: 4.5,
            completion_pct: 100,
            rewatch_count: 1,
          };
        }).filter((i) => i.title && i.title !== 'Unknown Title');

        payload = { items, file_format: detectedFormat };
      }

      const res = await api.post('/history/import', payload);
      setSuccessCount(res.data.imported_count);
      setTimeout(() => {
        if (onImportSuccess) onImportSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-obsidian-canvas/50 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-rise"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-glass-modal border border-outline-variant relative flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-outline-variant/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-gilded-amber text-[18px]">sync_alt</span>
              <span className="font-meta-tag text-meta-tag uppercase text-secondary tracking-wider">
                ADAPTIVE MEDIA ENGINE · IMPORT
              </span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface mt-1">
              Import Consumption History
            </h3>
            <p className="font-body-sm text-body-sm text-secondary">
              Direct ingestion of export files without third-party scraping or dark patterns.
            </p>
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            className="p-1.5 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Drag & Drop File Zone */}
        <div className="relative border-2 border-dashed border-outline-variant/80 hover:border-on-surface rounded-xl p-6 text-center bg-surface-container-low transition-colors cursor-pointer group">
          <input
            type="file"
            accept=".json,.csv"
            onChange={handleFileUpload}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          <div className="flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-gilded-amber text-[32px] group-hover:scale-110 transition-transform">
              upload_file
            </span>
            <span className="font-headline-sm text-base text-on-surface">
              {file ? file.name : 'Drop ledger file here or click to browse'}
            </span>
            <span className="font-meta-tag text-[10px] text-secondary uppercase tracking-widest">
              Accepts Letterboxd, Goodreads, Steam CSV, or JSON
            </span>
          </div>
        </div>

        {/* Auto-detected Format Badge & Override Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-meta-label text-meta-label uppercase text-on-surface-variant">
              Detected Schema:
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-primary text-on-primary font-meta-tag text-[10px] uppercase font-bold tracking-wider">
              {detectedFormat.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {['json', 'letterboxd', 'goodreads', 'steam'].map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setDetectedFormat(fmt)}
                className={`px-2.5 py-0.5 rounded-full font-meta-tag text-[9px] uppercase transition-colors ${
                  detectedFormat === fmt
                    ? 'bg-secondary text-on-secondary'
                    : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {/* Text Area / Paste Input */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="font-meta-label text-meta-label uppercase text-on-surface-variant">
              Or Direct Payload String
            </label>
            <button
              type="button"
              onClick={() => {
                setRawText(JSON.stringify(sampleJson, null, 2));
                setDetectedFormat('json');
              }}
              className="font-meta-tag text-[10px] uppercase text-gilded-amber hover:underline"
            >
              + Insert Sample JSON
            </button>
          </div>
          <textarea
            value={rawText}
            onChange={(e) => {
              setRawText(e.target.value);
              setDetectedFormat(detectFormatFromContent(e.target.value));
            }}
            rows={5}
            placeholder='[ { "title": "Severance", "media_type": "tv", "rating": 5.0, "completion_pct": 100 } ]'
            className="w-full p-3.5 rounded-xl bg-surface-container text-on-surface font-mono text-xs border border-outline-variant/60 focus:outline-none focus:border-on-surface transition-colors"
          />
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 bg-error-container text-on-error-container rounded-lg font-body-sm text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Success Counter Notification */}
        {successCount !== null && (
          <div className="p-4 bg-surface-container-high text-on-surface rounded-xl border border-outline-variant flex items-center justify-between">
            <span className="font-meta-tag text-meta-tag uppercase text-gilded-amber font-bold">
              {successCount} VOLUMES / ARTIFACTS IMPORTED
            </span>
            <span className="font-meta-tag text-[10px] uppercase text-secondary">
              Recalibrating taste vectors...
            </span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/60">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full font-button-text text-button-text uppercase text-secondary hover:text-on-surface transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={loading || !rawText.trim()}
            className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary-container text-on-primary font-button-text text-button-text uppercase shadow-md transition-all disabled:opacity-50 active:scale-95 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">download_done</span>
            <span>{loading ? 'Ingesting...' : 'Confirm Ingestion'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
