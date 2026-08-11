import React from 'react';
import { Sliders, ShieldCheck } from 'lucide-react';
import { ValuesSelectorForm } from '../components/ValuesSelectorForm';

export const Settings = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-white/[0.08]">
        <div className="flex items-center space-x-2 text-xs text-apple-blue font-mono mb-1.5">
          <ShieldCheck className="w-4 h-4" />
          <span>USER-ALIGNED EXPLICIT CRITERIA • ZERO DARK PATTERNS</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Values & Preference Boundary
        </h1>
        <p className="text-sm text-apple-textSecondary mt-1">
          Directly control how candidates are generated, filtered, and weighted across your profile.
        </p>
      </div>

      <ValuesSelectorForm />
    </div>
  );
};
