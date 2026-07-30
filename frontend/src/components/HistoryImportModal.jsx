import React, { useState } from 'react';
import { X, Upload, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { api } from '../api/client';

export const HistoryImportModal = ({ isOpen, onClose, onImportSuccess }) => {
  if (!isOpen) return null;

  const [jsonText, setJsonText] = useState('');
  const [file, setFile] = useState(null);
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
      rating: 4.5,
      completion_pct: 100,
      rewatch_count: 1
    }
  ];

  const handleFileUpload = (e) => {
    const uploaded = e.target.files[0];
    if (!uploaded) return;
    setFile(uploaded);
    const reader = new FileReader();
    reader.onload = (event) => {
      setJsonText(event.target.result);
    };
    reader.readAsText(uploaded);
  };

  const handleImport = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessCount(null);

    try {
      let parsedItems = [];
      try {
        parsedItems = JSON.parse(jsonText);
      } catch (err) {
        throw new Error('Invalid JSON format. Please ensure valid JSON syntax.');
      }

      if (!Array.isArray(parsedItems)) {
        throw new Error('JSON root must be an array of media history items.');
      }

      const res = await api.post('/history/import', {
        items: parsedItems,
        file_format: 'json',
      });

      setSuccessCount(res.data.imported_count);
      setTimeout(() => {
        if (onImportSuccess) onImportSuccess();
        onClose();
      }, 1800);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xl animate-fade-in">
      <div className="apple-card w-full max-w-xl p-7 rounded-squircle-2xl border border-white/15 shadow-apple-card-hover space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-squircle-sm bg-apple-blue/15 text-apple-blue border border-apple-blue/20">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Import History</h3>
              <p className="text-xs text-apple-textSecondary">Bootstrap your taste model with past data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/[0.08] text-apple-textSecondary hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleImport} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-white block mb-2">
              Select JSON File
            </label>
            <div className="border border-dashed border-white/20 hover:border-white/40 p-5 rounded-squircle text-center bg-white/[0.02] cursor-pointer transition-colors relative">
              <input
                type="file"
                accept=".json,.csv"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <FileText className="w-7 h-7 text-apple-blue mx-auto mb-1.5" />
              <span className="text-xs font-medium text-white block">
                {file ? file.name : 'Click to select or drag a .json file'}
              </span>
              <span className="text-[10px] text-apple-textTertiary font-mono mt-0.5 block">
                Accepts JSON array of history items
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-white">
                Or Paste JSON Payload
              </label>
              <button
                type="button"
                onClick={() => setJsonText(JSON.stringify(sampleJson, null, 2))}
                className="text-[11px] text-apple-blue hover:underline font-mono"
              >
                Insert Sample Data
              </button>
            </div>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='[ { "title": "Dune", "media_type": "movie", "rating": 5, "completion_pct": 100 } ]'
              rows={6}
              className="w-full px-3.5 py-2.5 rounded-squircle bg-black/60 border border-white/10 text-xs font-mono text-white placeholder-apple-textTertiary focus:outline-none focus:border-apple-blue transition-colors"
            />
          </div>

          {error && (
            <div className="p-3 rounded-squircle bg-apple-red/10 border border-apple-red/25 text-xs text-apple-red flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successCount !== null && (
            <div className="p-3 rounded-squircle bg-apple-green/10 border border-apple-green/25 text-xs text-apple-green flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Successfully imported {successCount} media history records!</span>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-medium text-apple-textSecondary hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !jsonText.trim()}
              className="px-6 py-2.5 rounded-full bg-apple-blue hover:bg-apple-blueHover text-white text-xs font-bold shadow-apple-blue-glow transition-all disabled:opacity-50 active:scale-95"
            >
              {loading ? 'Processing Import...' : 'Import Records'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
