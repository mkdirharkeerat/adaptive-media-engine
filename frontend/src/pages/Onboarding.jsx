import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ValuesSelectorForm } from '../components/ValuesSelectorForm';
import { HistoryImportModal } from '../components/HistoryImportModal';

const MODE_OPTIONS = [
  {
    id: 'fiction',
    label: 'Fiction',
    icon: 'auto_stories',
    copy: 'I mostly want stories — novels, literary film, speculative worlds.',
  },
  {
    id: 'entertainment',
    label: 'Entertainment',
    icon: 'movie',
    copy: 'I mostly want to watch — series, thrillers, comedy, spectacle.',
  },
  {
    id: 'non-fiction',
    label: 'Non-fiction',
    icon: 'school',
    copy: 'I mostly want to learn — docs, history, science, self-improvement.',
  },
];

export const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [imported, setImported] = useState(false);
  const [selectedModes, setSelectedModes] = useState(['fiction']);
  const navigate = useNavigate();

  const handleValuesSaved = () => {
    navigate('/');
  };

  const toggleMode = (id) => {
    setSelectedModes((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        return prev.filter((m) => m !== id);
      }
      return [...prev, id];
    });
  };

  const stepLabel = step === 1 ? 'CONSUMPTION PROVENANCE' : step === 2 ? 'PRIMARY MODE' : 'EXPLICIT VALUE BOUNDARIES';

  return (
    <div className="w-full bg-surface min-h-screen py-12 px-6 lg:px-8">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        <div className="flex items-center justify-between border-b border-outline-variant/60 pb-4">
          <div className="flex items-center gap-2 font-meta-tag text-meta-tag uppercase text-gilded-amber font-bold">
            <span className="material-symbols-outlined text-[16px]">bookmark_border</span>
            <span>ADAPTIVE MEDIA ENGINE SETUP · STEP {step} OF 3</span>
          </div>
          <span className="font-meta-tag text-meta-tag uppercase text-secondary">
            {stepLabel}
          </span>
        </div>

        {step === 1 ? (
          <div className="bg-surface-container-low p-8 sm:p-10 rounded-2xl border border-outline-variant/60 shadow-sm space-y-8 animate-rise">
            <div className="space-y-2">
              <h1 className="font-headline-lg text-3xl sm:text-4xl text-on-surface font-serif italic tracking-tight">
                Import your reading &amp; viewing logs
              </h1>
              <p className="font-body-md text-body-md text-secondary leading-relaxed">
                We calculate true completion depth, rewatch multipliers, and drop-off points rather than shallow clicks.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: 'movie', title: 'Letterboxd', sub: '.CSV Export' },
                { icon: 'menu_book', title: 'Goodreads', sub: '.CSV Ledger' },
                { icon: 'data_object', title: 'Custom JSON', sub: 'Generic Payload' },
              ].map((card) => (
                <div
                  key={card.title}
                  onClick={() => setIsImportModalOpen(true)}
                  className="p-5 rounded-xl bg-surface hover:bg-surface-container border border-outline-variant/60 hover:border-on-surface transition-all cursor-pointer flex flex-col items-center text-center gap-2 group"
                >
                  <span className="material-symbols-outlined text-gilded-amber text-[28px] group-hover:scale-110 transition-transform">
                    {card.icon}
                  </span>
                  <span className="font-headline-sm text-sm text-on-surface font-semibold">{card.title}</span>
                  <span className="font-meta-tag text-[9px] uppercase text-secondary">{card.sub}</span>
                </div>
              ))}
            </div>

            {imported && (
              <div className="p-4 bg-surface-container-high rounded-xl border border-outline-variant flex items-center gap-3">
                <span className="material-symbols-outlined text-gilded-amber text-[20px]">check_circle</span>
                <span className="font-meta-tag text-meta-tag uppercase text-on-surface font-semibold">
                  History ingestion succeeded. Next: choose fiction, entertainment, or non-fiction.
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-outline-variant/40">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="font-button-text text-button-text uppercase text-secondary hover:text-on-surface underline underline-offset-4 transition-colors"
              >
                Skip Ingestion (Clean Slate)
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-8 py-3 rounded-full bg-primary hover:bg-primary-container text-on-primary font-button-text text-button-text uppercase shadow-md transition-all active:scale-95 flex items-center gap-2"
              >
                <span>Continue to Step 2</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        ) : step === 2 ? (
          <div className="bg-surface-container-low p-8 sm:p-10 rounded-2xl border border-outline-variant/60 shadow-sm space-y-8 animate-rise">
            <div className="space-y-2">
              <h1 className="font-headline-lg text-3xl sm:text-4xl text-on-surface font-serif italic tracking-tight">
                What should the engine optimize for?
              </h1>
              <p className="font-body-md text-body-md text-secondary leading-relaxed">
                This chooses your default shelf. You can still mix formats (movies, TV, books) inside each mode.
              </p>
            </div>
            <div className="space-y-3">
              {MODE_OPTIONS.map((mode) => {
                const selected = selectedModes.includes(mode.id);
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => toggleMode(mode.id)}
                    className={`w-full p-5 rounded-xl border text-left flex items-start gap-4 transition-all ${
                      selected
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface text-on-surface border-outline-variant/60 hover:bg-surface-container'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[28px]">{mode.icon}</span>
                    <span>
                      <span className="font-headline-sm text-lg block">{mode.label}</span>
                      <span className={`font-body-sm text-sm mt-1 block ${selected ? 'text-on-primary/80' : 'text-secondary'}`}>
                        {mode.copy}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-outline-variant/40">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="font-button-text text-button-text uppercase text-secondary hover:text-on-surface"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-8 py-3 rounded-full bg-primary text-on-primary font-button-text text-button-text uppercase shadow-md"
              >
                Continue to genres &amp; pacing
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-rise">
            <div className="space-y-2 pb-2">
              <h1 className="font-headline-lg text-3xl sm:text-4xl text-on-surface font-serif italic tracking-tight">
                Establish your taste boundaries
              </h1>
              <p className="font-body-md text-body-md text-secondary leading-relaxed">
                Set genres, pacing bands, optional style axes, and how you actually consume media.
              </p>
            </div>
            <ValuesSelectorForm onSaved={handleValuesSaved} isInitial={true} initialContentModes={selectedModes} />
          </div>
        )}
      </div>

      <HistoryImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={() => {
          setImported(true);
          setTimeout(() => setStep(2), 1200);
        }}
      />
    </div>
  );
};
