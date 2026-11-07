import React from 'react';
import { Coffee, Sparkles, Smile, Clock } from 'lucide-react';

export default function Relax() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-[calc(100vh-3.5rem)] bg-gradient-to-b from-slate-50 to-emerald-50/30 p-6 text-center">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
          <Coffee className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider inline-flex items-center space-x-1">
            <Sparkles className="w-3 h-3 mr-1" />
            <span>Future Extension</span>
          </span>
          <h2 className="text-xl font-bold text-slate-900">Relax & Wellness Corner</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Take a breather between shifts. Interactive games, shift wellness check-ins, and team appreciation tools will be arriving in a future release.
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-600 text-xs italic">
          "Work hard, stay connected, and remember to take a deep breath."
        </div>

        <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span>Scheduled for Extension Phase</span>
        </div>
      </div>
    </div>
  );
}

