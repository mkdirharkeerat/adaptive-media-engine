import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { ValuesSelectorForm } from '../components/ValuesSelectorForm';

export const Onboarding = () => {
  const navigate = useNavigate();

  const handleSaved = () => {
    navigate('/');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-12 space-y-8">
      <div className="text-center max-w-xl mx-auto space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-apple-green/15 text-apple-green border border-apple-green/25 text-xs font-mono">
          <ShieldCheck className="w-4 h-4" />
          <span>INITIAL SETUP • STEP 1 OF 1</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Define Your Media Values
        </h1>
        <p className="text-xs sm:text-sm text-apple-textSecondary leading-relaxed">
          Tell us what types of storytelling, pacing, and tone you value. We will use these as hard constraints for candidate generation.
        </p>
      </div>

      <ValuesSelectorForm onSaved={handleSaved} isInitial={true} />
    </div>
  );
};
