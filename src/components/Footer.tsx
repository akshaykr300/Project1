/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { NavTab } from './Header';
import { ShieldCheck, AlertCircle } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: NavTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-10 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Transparent Security Notice Banner */}
        <div className="mb-8 p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-slate-400 leading-relaxed">
            <span className="font-semibold text-slate-200">Payment Verification Limitation: </span>
            A screenshot is not legal or operational proof of an electronic fund transfer. Fraudulent actors frequently use mock
            receipt generators to produce visual counterfeits. Always cross-reference the 12-digit UTR reference directly with
            your business bank statement or UPI merchant settlement account.
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-900">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300 font-medium">Fake UPI Shield</span>
            <span className="text-slate-600">·</span>
            <span>Computer Vision & Heuristic Payment Fraud Defense</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => onNavigate('how_it_works')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Pipeline Architecture
            </button>
            <button
              onClick={() => onNavigate('health')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              System Health
            </button>
            <button
              onClick={() => onNavigate('docs')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              Windows & MySQL Setup
            </button>
            <button
              onClick={() => onNavigate('about')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              About Team
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
