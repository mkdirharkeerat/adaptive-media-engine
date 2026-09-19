import React from 'react';
import { CONTENT_MODES, FORMAT_TABS } from '../data/taxonomy';

const pillClass = (active) =>
  `px-4 py-1.5 rounded-full font-button-text text-button-text uppercase transition-all ${
    active
      ? 'bg-primary text-on-primary shadow-sm font-semibold'
      : 'text-on-surface-variant hover:text-on-surface'
  }`;

export const ModeFormatFilters = ({
  contentMode,
  onContentMode,
  mediaType,
  onMediaType,
  counts,
}) => (
  <div className="flex flex-col gap-3">
    <div className="flex items-center p-1 bg-surface-container rounded-full border border-outline-variant/60 shadow-inner overflow-x-auto">
      {CONTENT_MODES.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onContentMode(tab.id)}
          className={pillClass(contentMode === tab.id)}
        >
          {tab.label}
          {counts?.[tab.id] != null ? ` ${counts[tab.id]}` : ''}
        </button>
      ))}
    </div>
    <div className="flex items-center p-1 bg-surface-container-low rounded-full border border-outline-variant/40 overflow-x-auto">
      {FORMAT_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onMediaType(tab.id)}
          className={`px-3.5 py-1 rounded-full font-meta-tag text-meta-tag uppercase transition-all ${
            mediaType === tab.id
              ? 'bg-primary text-on-primary font-bold shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  </div>
);
