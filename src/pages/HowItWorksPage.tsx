/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import {
  Upload,
  Eye,
  FileText,
  Cpu,
  CheckSquare,
  Scale,
  Database,
  LayoutDashboard,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  AlertTriangle
} from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Image Acquisition',
      desc: 'User uploads a payment screenshot or captures the customer device screen live via navigator.mediaDevices.getUserMedia.',
      icon: Upload,
    },
    {
      num: '02',
      title: 'Format & Size Validation',
      desc: 'Strict boundary checks enforce accepted formats (JPEG, PNG, WebP) and maximum payload limits (15MB) to block malformed inputs.',
      icon: Smartphone,
    },
    {
      num: '03',
      title: 'Safe Header Decoding',
      desc: 'Pillow and OpenCV safely inspect headers and decode byte streams without executing untrusted image scripts.',
      icon: Eye,
    },
    {
      num: '04',
      title: 'OpenCV Preprocessing',
      desc: 'Applies CLAHE contrast enhancement, computes Laplacian blur variance, and generates Otsu binary threshold masks.',
      icon: Eye,
    },
    {
      num: '05',
      title: 'Tesseract OCR Extraction',
      desc: 'Tesseract OCR parses raw text, normalizes whitespace, and extracts string patterns without inventing missing fields.',
      icon: FileText,
    },
    {
      num: '06',
      title: 'Structured Field Regex Matching',
      desc: 'Deterministic regular expressions isolate 12-digit UTR numbers, UPI VPA handles (@okaxis, @ybl), amounts, and timestamps.',
      icon: CheckSquare,
    },
    {
      num: '07',
      title: 'Physical & Aspect Ratio Checks',
      desc: 'Calculates viewport aspect ratios to confirm mobile screen geometry and flags abnormally compressed thumbnails.',
      icon: Scale,
    },
    {
      num: '08',
      title: 'CNN Model Inference',
      desc: 'When trained weights are loaded, a 3-block convolutional neural network evaluates font boundary gradients and compression artifacts.',
      icon: Cpu,
    },
    {
      num: '09',
      title: 'Rule-Based Heuristic Audit',
      desc: 'Flags missing UTRs, malformed reference numbers, status mismatches (e.g. pending/failed), or explicit prank-app signatures.',
      icon: ShieldAlert,
    },
    {
      num: '10',
      title: 'Evidence Synthesis',
      desc: 'Synthesizes all signals into one of four cautious verdicts: SUSPICIOUS, NO_OBVIOUS_ISSUES, INCONCLUSIVE, or ANALYSIS_INCOMPLETE.',
      icon: Scale,
    },
    {
      num: '11',
      title: 'MySQL Audit Persistence',
      desc: 'Stores the complete evaluation, extracted fields, image hash, and diagnostic metrics into the analysis_history table.',
      icon: Database,
    },
    {
      num: '12',
      title: 'Explainable UI Report',
      desc: 'Renders the transparent audit report with raw OCR inspection, reasons, and a clear reminder that screenshots cannot prove bank transfer.',
      icon: LayoutDashboard,
    },
  ];

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          System Architecture & Pipeline Flow
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-2xl">
          Understanding the 12-step verification pipeline that separates genuine payment confirmations from forged mock generator receipts.
        </p>
      </div>

      {/* Anatomy of Fake UPI Scams Explainer */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h2>How Fraudulent "Fake UPI" Screenshot Scams Operate</h2>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Fraudsters frequently target merchants and peer-to-peer sellers by using sideloaded Android spoof apps (such as
          "FakePay" or "Prank Payment Generator"). These apps mimic the visual layout of Google Pay, PhonePe, or Paytm by allowing
          the scammer to type in any recipient name, amount, and custom timestamp. The app then renders a fake green checkmark animation
          and "Payment Successful" screen without connecting to NPCI or sending money through the banking switch.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="font-semibold text-amber-400 block mb-1">Malformed / Missing UTR</span>
            <p className="text-slate-400 text-[11px]">
              Spoof apps often omit the 12-digit Unique Transaction Reference (UTR) or insert short 4-to-6 digit dummy numbers.
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="font-semibold text-amber-400 block mb-1">Font & Layout Mismatch</span>
            <p className="text-slate-400 text-[11px]">
              Generated receipts render text with non-standard system fonts, incorrect kerning, or misaligned Rupee symbols.
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="font-semibold text-amber-400 block mb-1">Zero Bank Settlement</span>
            <p className="text-slate-400 text-[11px]">
              Because no bank API is touched, no SMS notification or bank ledger credit occurs on the merchant's account.
            </p>
          </div>
        </div>
      </div>

      {/* 12-Step Architecture Flowchart */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
          12-Step Forensic Verification Flowchart
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="p-5 rounded-xl border border-slate-800 bg-slate-900/20 hover:border-slate-700 transition-colors flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-emerald-400">{step.num}</span>
                    <Icon className="w-4 h-4 text-slate-500" />
                  </div>
                  <h3 className="text-xs font-semibold text-white">{step.title}</h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cautious Assessment Classification Logic */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30 space-y-4">
        <h2 className="text-sm font-semibold text-white">Transparent Verdict Categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/40 space-y-1">
            <span className="font-semibold text-red-400">SUSPICIOUS</span>
            <p className="text-slate-300 text-[11px]">
              Triggered if explicit spoof signatures are detected, UTR reference is invalid/missing, status indicates failure/pending,
              or multiple severe heuristic red flags are raised.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 space-y-1">
            <span className="font-semibold text-emerald-400">NO OBVIOUS ISSUES</span>
            <p className="text-slate-300 text-[11px]">
              Assigned when all standard fields (amount, valid 12-digit UTR, valid UPI handle) are present and no tampering flags were raised.
              Does not constitute proof of payment.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/40 space-y-1">
            <span className="font-semibold text-amber-400">INCONCLUSIVE</span>
            <p className="text-slate-300 text-[11px]">
              Returned when image resolution is too low, text is severely blurred, or conflicting metadata makes automated assessment unreliable.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-semibold text-slate-300">ANALYSIS INCOMPLETE</span>
            <p className="text-slate-400 text-[11px]">
              Returned when required components (such as OCR or decoding) cannot be executed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
