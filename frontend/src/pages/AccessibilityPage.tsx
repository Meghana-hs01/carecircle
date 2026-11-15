import React from 'react';
import { Eye, Type, Volume2, CheckCircle2, RotateCcw, ShieldCheck, SunMedium } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

export const AccessibilityPage: React.FC = () => {
  const {
    highContrast,
    largeText,
    screenReaderHelp,
    toggleHighContrast,
    toggleLargeText,
    toggleScreenReaderHelp,
    resetAccessibility,
  } = useAccessibility();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Accessibility & Display</h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Customize visual contrast, typography scaling, and assistive technology controls for maximum comfort.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Large Text Mode */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Type className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-900">Large Text & Button Scale</h3>
              </div>
              <p className="text-xs text-slate-600 max-w-md">
                Enlarges all interface labels, dose action buttons, and form inputs to ensure readability for elderly users.
              </p>
            </div>
            <button
              onClick={toggleLargeText}
              aria-pressed={largeText}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition ${
                largeText
                  ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {largeText ? 'Active (Large)' : 'Standard Size'}
            </button>
          </div>

          {/* High Contrast Mode */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <SunMedium className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">High Contrast Mode</h3>
              </div>
              <p className="text-xs text-slate-600 max-w-md">
                Increases contrast ratios with deep black backgrounds, bright borders, and vivid text elements conforming to WCAG 2.1 AAA.
              </p>
            </div>
            <button
              onClick={toggleHighContrast}
              aria-pressed={highContrast}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition ${
                highContrast
                  ? 'bg-black text-yellow-300 border-yellow-400 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {highContrast ? 'Active (High Contrast)' : 'Standard Theme'}
            </button>
          </div>

          {/* Screen Reader Assistance */}
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-bold text-slate-900">Screen Reader Assistance Landmarks</h3>
              </div>
              <p className="text-xs text-slate-600 max-w-md">
                Optimizes ARIA labels, live announcement regions, and modal focuses for JAWS, NVDA, and VoiceOver.
              </p>
            </div>
            <button
              onClick={toggleScreenReaderHelp}
              aria-pressed={screenReaderHelp}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition ${
                screenReaderHelp
                  ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {screenReaderHelp ? 'Active' : 'Default ARIA'}
            </button>
          </div>

          {/* Live Preview Box */}
          <div className="p-5 border border-slate-200 rounded-2xl bg-white space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Accessibility Preview Sample
            </span>
            <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-200 flex items-center justify-between">
              <div>
                <p className="text-base font-bold text-slate-900">Lisinopril 20mg</p>
                <p className="text-xs text-slate-600">Scheduled for 08:00 AM • Take with a glass of water</p>
              </div>
              <button
                type="button"
                className="px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl shadow-sm"
              >
                Mark as Taken
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              onClick={resetAccessibility}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset to Defaults</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
