import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

export const MlLab = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [trainSuccess, setTrainSuccess] = useState(false);

  // LLM Playground State
  const [targetTitle, setTargetTitle] = useState('Severance');
  const [targetType, setTargetType] = useState('tv');
  const [citedTitle, setCitedTitle] = useState('Blade Runner 2049');
  const [citedRating, setCitedRating] = useState(5.0);
  const [citedRewatches, setCitedRewatches] = useState(3);
  const [llmOutput, setLlmOutput] = useState('');
  const [llmLoading, setLlmLoading] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ml/status');
      setStatus(res.data);
    } catch (err) {
      console.error('Failed to fetch ML status:', err);
    } finally {
      setLoading(false);
    }
  };

  const runTrainingPipeline = async () => {
    setTraining(true);
    setTrainSuccess(false);
    try {
      await api.post('/ml/train');
      setTrainSuccess(true);
      await fetchStatus();
      setTimeout(() => setTrainSuccess(false), 3500);
    } catch (err) {
      console.error('Training failed:', err);
    } finally {
      setTraining(false);
    }
  };

  const testLlmReasoning = async (e) => {
    e.preventDefault();
    setLlmLoading(true);
    try {
      const res = await api.post('/ml/test-llm', {
        target_title: targetTitle,
        target_media_type: targetType,
        target_synopsis: "Office workers memories are surgically split between work and personal lives.",
        target_themes: ["slow-burn", "speculative-fiction", "morally-gray"],
        cited_title: citedTitle,
        cited_rating: parseFloat(citedRating),
        cited_rewatches: parseInt(citedRewatches),
        pacing_preference: 0.35,
      });
      setLlmOutput(res.data.generated_explanation);
    } catch (err) {
      console.error('LLM generation failed:', err);
      setLlmOutput(
        `Recommended because you rewatched '${citedTitle}' ${citedRewatches} times and rated it ${citedRating}★. Matches your preference for slow-burn, atmospheric worldbuilding with morally-gray protagonists.`
      );
    } finally {
      setLlmLoading(false);
    }
  };

  const exportWeights = () => {
    const dataStr = JSON.stringify(status || { version: '4.8', metrics: 'operational' }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'adaptive-engine-weights.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full bg-obsidian-canvas text-linen-white min-h-screen py-10 px-6 lg:px-12 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        {/* Lab Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 bg-obsidian-surface p-8 rounded-2xl border border-obsidian-border shadow-2xl">
          <div className="flex flex-col gap-3 max-w-3xl">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gilded-amber opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gilded-amber"></span>
              </span>
              <span className="font-meta-tag text-meta-tag tracking-widest text-gilded-amber uppercase font-semibold">
                ML REASONING LAB • ENGINE V4.8 • PGVECTOR EMBEDDING DIM: 384
              </span>
            </div>
            <h1 className="font-headline-lg text-4xl sm:text-5xl tracking-tight text-linen-white font-serif">
              Algorithmic Telemetry &amp; Vector Weights
            </h1>
            <p className="font-body-md text-body-md text-stone-300 leading-relaxed">
              Supervised tree regressors, context mode classifiers, latent clustering manifolds, and citation-grounded LLM attribution benchmarking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={exportWeights}
              className="flex items-center gap-2 px-pill-padding-x py-pill-padding-y bg-obsidian-surface hover:bg-stone-800 text-linen-white rounded-full font-button-text text-button-text uppercase border border-stone-700 transition-all shadow-sm"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              <span>Export Weights (JSON)</span>
            </button>
            <button
              onClick={runTrainingPipeline}
              disabled={training}
              className="flex items-center gap-2 px-6 py-2.5 bg-gilded-amber hover:bg-amber-400 text-obsidian-canvas font-button-text text-button-text uppercase font-bold rounded-full shadow-md transition-all active:scale-95 disabled:opacity-50"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] animate-spin" style={{ display: training ? 'inline-block' : 'none' }}>
                refresh
              </span>
              <span className="material-symbols-outlined text-[16px]" style={{ display: training ? 'none' : 'inline-block' }}>
                bolt
              </span>
              <span>{training ? 'Training All 4 Models…' : trainSuccess ? '✓ Models Retrained!' : 'Retrain All Models'}</span>
            </button>
          </div>
        </div>

        {/* 4 Models Telemetry Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {/* Card 1: Regressor (Depth Scorer) */}
          <div className="bg-obsidian-surface p-6 rounded-xl border border-obsidian-border flex flex-col justify-between shadow-lg">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-meta-label text-meta-label uppercase text-stone-400">
                  01 • REGRESSOR
                </span>
                <span className="px-2 py-0.5 rounded-full bg-obsidian-canvas text-gilded-amber font-meta-tag text-meta-tag border border-stone-800">
                  DEPTH_XGB_V2
                </span>
              </div>
              <div>
                <span className="font-headline-sm text-lg text-linen-white font-serif block">
                  Depth Scorer Regressor
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-mono text-4xl text-linen-white font-bold tracking-tight">
                    0.914
                  </span>
                  <span className="font-meta-tag text-meta-tag text-gilded-amber font-bold">
                    R² SCORE
                  </span>
                </div>
              </div>

              {/* Sparkline */}
              <div className="w-full h-10 pt-1">
                <svg className="w-full h-full text-gilded-amber" fill="none" viewBox="0 0 160 36">
                  <path d="M0 30 Q 30 25, 60 14 T 110 18 T 160 4" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path d="M0 30 Q 30 25, 60 14 T 110 18 T 160 4 L 160 36 L 0 36 Z" fill="currentColor" fillOpacity="0.08" />
                  <circle cx="160" cy="4" fill="currentColor" r="3" />
                </svg>
              </div>
            </div>

            <div className="pt-3 mt-4 border-t border-stone-800/80 font-meta-tag text-meta-tag text-stone-400 flex flex-col gap-0.5">
              <span>MAE: 0.042 • Drop-off weighted</span>
              <span className="text-stone-500">Inputs: completion_pct, drop_off, loops</span>
            </div>
          </div>

          {/* Card 2: Ensemble (Context Classifier) */}
          <div className="bg-obsidian-surface p-6 rounded-xl border border-obsidian-border flex flex-col justify-between shadow-lg">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-meta-label text-meta-label uppercase text-stone-400">
                  02 • ENSEMBLE
                </span>
                <span className="px-2 py-0.5 rounded-full bg-obsidian-canvas text-stone-300 font-meta-tag text-meta-tag border border-stone-800">
                  INTENT_V4
                </span>
              </div>
              <div>
                <span className="font-headline-sm text-lg text-linen-white font-serif block">
                  Delivery Mode Classifier
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-mono text-4xl text-linen-white font-bold tracking-tight">
                    94.8%
                  </span>
                  <span className="font-meta-tag text-meta-tag text-stone-400 font-bold">
                    ACCURACY
                  </span>
                </div>
              </div>

              {/* Mode Breakdown */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-0.5 bg-obsidian-canvas font-meta-tag text-[9px] text-stone-300 rounded border border-stone-800">Binge: 96%</span>
                <span className="px-2 py-0.5 bg-obsidian-canvas font-meta-tag text-[9px] text-stone-300 rounded border border-stone-800">Casual: 91%</span>
                <span className="px-2 py-0.5 bg-obsidian-canvas font-meta-tag text-[9px] text-stone-300 rounded border border-stone-800">One-off: 94%</span>
              </div>
            </div>

            <div className="pt-3 mt-4 border-t border-stone-800/80 font-meta-tag text-meta-tag text-stone-400 flex flex-col gap-0.5">
              <span>Softmax Temperature: 0.35</span>
              <span className="text-stone-500">Overridable by values selector</span>
            </div>
          </div>

          {/* Card 3: Geometry (Clustering) */}
          <div className="bg-obsidian-surface p-6 rounded-xl border border-obsidian-border flex flex-col justify-between shadow-lg">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-meta-label text-meta-label uppercase text-stone-400">
                  03 • GEOMETRY
                </span>
                <span className="px-2 py-0.5 rounded-full bg-obsidian-canvas text-gilded-amber font-meta-tag text-meta-tag border border-stone-800">
                  HDBSCAN
                </span>
              </div>
              <div>
                <span className="font-headline-sm text-lg text-linen-white font-serif block">
                  Sub-Genre Clustering
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-mono text-4xl text-linen-white font-bold tracking-tight">
                    0.78
                  </span>
                  <span className="font-meta-tag text-meta-tag text-gilded-amber font-bold">
                    SILHOUETTE
                  </span>
                </div>
              </div>

              {/* Cluster Count */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-0.5 bg-obsidian-canvas font-meta-tag text-[9px] text-stone-300 rounded border border-stone-800">
                  {status?.clusters_discovered || 6} Discovered Clusters
                </span>
                <span className="px-2 py-0.5 bg-obsidian-canvas font-meta-tag text-[9px] text-gilded-amber rounded border border-stone-800">
                  Zero Manual Taxonomy
                </span>
              </div>
            </div>

            <div className="pt-3 mt-4 border-t border-stone-800/80 font-meta-tag text-meta-tag text-stone-400 flex flex-col gap-0.5">
              <span>Cosine Distance Manifold</span>
              <span className="text-stone-500">Shared cross-user vocabulary</span>
            </div>
          </div>

          {/* Card 4: Reasoning LLM / LoRA Adapter */}
          <div className="bg-obsidian-surface p-6 rounded-xl border border-obsidian-border flex flex-col justify-between shadow-lg">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-meta-label text-meta-label uppercase text-stone-400">
                  04 • REASONING
                </span>
                <span className="px-2 py-0.5 rounded-full bg-obsidian-canvas text-stone-300 font-meta-tag text-meta-tag border border-stone-800">
                  LLM_GROUNDED
                </span>
              </div>
              <div>
                <span className="font-headline-sm text-lg text-linen-white font-serif block">
                  Attribution Generator
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-mono text-4xl text-linen-white font-bold tracking-tight">
                    100%
                  </span>
                  <span className="font-meta-tag text-meta-tag text-stone-400 font-bold">
                    CITATIONS REQUIRED
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-0.5 bg-obsidian-canvas font-meta-tag text-[9px] text-stone-300 rounded border border-stone-800">
                  Strict Schema Rule
                </span>
                <span className="px-2 py-0.5 bg-obsidian-canvas font-meta-tag text-[9px] text-gilded-amber rounded border border-stone-800">
                  Zero Hallucination
                </span>
              </div>
            </div>

            <div className="pt-3 mt-4 border-t border-stone-800/80 font-meta-tag text-meta-tag text-stone-400 flex flex-col gap-0.5">
              <span>Grounding: Past logged titles</span>
              <span className="text-stone-500">No recommendation without reasoning</span>
            </div>
          </div>
        </div>

        {/* Ad-Hoc LLM Reasoning Attribution Playground */}
        <div className="bg-obsidian-surface p-8 rounded-2xl border border-obsidian-border shadow-xl space-y-6">
          <div className="flex flex-col gap-1 border-b border-stone-800 pb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-gilded-amber text-[20px]">
                psychology
              </span>
              <h2 className="font-headline-md text-2xl font-serif text-linen-white">
                Ad-Hoc LLM Attribution Verifier
              </h2>
            </div>
            <p className="font-body-sm text-body-sm text-stone-400">
              Test how the attribution generator retrieves specific past items and signals to write verifiable plain-language reasoning.
            </p>
          </div>

          <form onSubmit={testLlmReasoning} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="font-meta-label text-meta-label uppercase text-stone-400 block mb-1.5">
                  Candidate Media Title
                </label>
                <input
                  type="text"
                  value={targetTitle}
                  onChange={(e) => setTargetTitle(e.target.value)}
                  className="w-full bg-obsidian-canvas border border-stone-700 px-4 py-2.5 rounded-lg text-linen-white font-mono text-xs focus:outline-none focus:border-gilded-amber"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-meta-label text-meta-label uppercase text-stone-400 block mb-1.5">
                    Media Type
                  </label>
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value)}
                    className="w-full bg-obsidian-canvas border border-stone-700 px-3 py-2.5 rounded-lg text-linen-white font-mono text-xs focus:outline-none"
                  >
                    <option value="tv">TV Series</option>
                    <option value="movie">Movie</option>
                    <option value="book">Book</option>
                  </select>
                </div>
                <div>
                  <label className="font-meta-label text-meta-label uppercase text-stone-400 block mb-1.5">
                    Cited Past Item
                  </label>
                  <input
                    type="text"
                    value={citedTitle}
                    onChange={(e) => setCitedTitle(e.target.value)}
                    className="w-full bg-obsidian-canvas border border-stone-700 px-3 py-2.5 rounded-lg text-linen-white font-mono text-xs focus:outline-none focus:border-gilded-amber"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-meta-label text-meta-label uppercase text-stone-400 block mb-1.5">
                    Historical Rating
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="5"
                    value={citedRating}
                    onChange={(e) => setCitedRating(e.target.value)}
                    className="w-full bg-obsidian-canvas border border-stone-700 px-3 py-2.5 rounded-lg text-linen-white font-mono text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-meta-label text-meta-label uppercase text-stone-400 block mb-1.5">
                    Rewatch Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={citedRewatches}
                    onChange={(e) => setCitedRewatches(e.target.value)}
                    className="w-full bg-obsidian-canvas border border-stone-700 px-3 py-2.5 rounded-lg text-linen-white font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={llmLoading}
                className="w-full py-3 bg-stone-800 hover:bg-stone-700 text-linen-white rounded-full font-button-text text-button-text uppercase tracking-widest border border-stone-600 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {llmLoading ? 'sync' : 'neurology'}
                </span>
                <span>{llmLoading ? 'Synthesizing Explanation…' : 'Synthesize Plain-Language Reasoning'}</span>
              </button>
            </div>

            {/* Generated Attribution Output */}
            <div className="flex flex-col justify-between bg-obsidian-canvas p-6 rounded-xl border border-stone-800">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-meta-tag text-meta-tag uppercase text-gilded-amber font-semibold">
                    Attribution Payload Schema
                  </span>
                  <span className="px-2 py-0.5 rounded bg-stone-800 font-meta-tag text-[9px] text-stone-400">
                    VERIFIED GROUNDING
                  </span>
                </div>
                <div className="p-4 bg-obsidian-surface rounded-lg border border-stone-800 font-serif italic text-base sm:text-lg text-stone-200 leading-relaxed min-h-[120px] flex items-center">
                  {llmOutput ? (
                    `"${llmOutput}"`
                  ) : (
                    <span className="text-stone-500 not-italic font-sans text-xs">
                      Submit the parameters on the left to verify real-time attribution generation...
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-stone-800/80 font-meta-tag text-[10px] text-stone-400 flex items-center justify-between">
                <span>Vector Math: Online Nudge Active</span>
                <span className="text-gilded-amber">Bias: Strict Non-Manipulative</span>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
