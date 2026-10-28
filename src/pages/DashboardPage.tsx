/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { NavTab } from '../components/Header';
import { DashboardStats, AnalysisRecord } from '../types';
import {
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  FileSearch,
  Camera,
  Cpu,
  Database,
  ArrowRight,
  TrendingUp,
  Clock,
  Layers,
  Search,
  Check,
  AlertTriangle,
  BookOpen,
  Zap,
  CheckCircle2,
  Lock,
  Globe
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardPageProps {
  stats: DashboardStats | null;
  loading: boolean;
  onNavigate: (tab: NavTab) => void;
  onSelectAnalysis: (record: AnalysisRecord) => void;
  onOpenContact?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  loading,
  onNavigate,
  onSelectAnalysis,
  onOpenContact,
}) => {
  const total = stats?.total_analyses ?? 0;
  const suspicious = stats?.suspicious_count ?? 0;
  const clean = stats?.no_obvious_issues_count ?? 0;
  const inconclusive = (stats?.inconclusive_count ?? 0) + (stats?.analysis_incomplete_count ?? 0);
  const rate = stats?.suspicious_rate_percentage ?? 0;

  // Hero Quick-Search UTR State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<{
    status: 'FOUND' | 'VALID_SYNTAX' | 'INVALID_FORMAT' | 'NOT_FOUND';
    message: string;
    matchedRecord?: AnalysisRecord;
  } | null>(null);

  // Pricing Interval Toggle
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    // Check against existing audits in stats
    const matched = stats?.recent_activity?.find(
      (a) =>
        a.extracted_fields?.utr === query ||
        a.extracted_fields?.upi_id?.toLowerCase() === query.toLowerCase() ||
        a.analysis_id === query
    );

    if (matched) {
      setSearchResult({
        status: 'FOUND',
        message: `Found in audit history: ${matched.original_filename} (${matched.assessment.replace(/_/g, ' ')})`,
        matchedRecord: matched,
      });
      return;
    }

    // Check UTR syntax (12 numeric digits)
    if (/^\d{12}$/.test(query)) {
      setSearchResult({
        status: 'VALID_SYNTAX',
        message: 'Valid 12-digit standard UTR format. No prior fraud flags recorded on this reference.',
      });
    } else if (query.includes('@')) {
      setSearchResult({
        status: 'VALID_SYNTAX',
        message: `Valid UPI VPA syntax structure for "${query}". Ready for screenshot cross-check.`,
      });
    } else {
      setSearchResult({
        status: 'INVALID_FORMAT',
        message: 'Non-standard UPI reference. Genuine bank UTRs must be exactly 12 numeric digits.',
      });
    }
  };

  return (
    <div className="space-y-16">
      {/* ──────────────────────────────────────────────────────────────────────────
          HERO SECTION: Inspired by the reference layout
          Left: High-impact display typography, value proposition, quick-search bar, trust links
          Right: Organic warm amber backdrop curve with interactive fraud shield & floating badges
         ────────────────────────────────────────────────────────────────────────── */}
      <section className="relative pt-2 pb-8 sm:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline & Action Bar */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2 text-xs font-medium text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Next-Gen FinTech Defense</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">Merchant Payment Protection</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1] text-balance">
              We Shield Your Business <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300">
                More Effectively
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
              Instantly verify customer UPI payment screenshots. Combining OpenCV computer vision,
              Tesseract OCR text extraction, and neural CNN models to detect fake payment APKs before goods leave your counter.
            </p>

            {/* Quick-Verify Input Pill Bar matching reference design */}
            <form onSubmit={handleQuickSearch} className="space-y-3 pt-2">
              <div className="relative flex items-center p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl focus-within:border-amber-400/80 transition-all max-w-lg">
                <div className="pl-3 pr-2 text-slate-400">
                  <Search className="w-5 h-5 text-amber-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (searchResult) setSearchResult(null);
                  }}
                  placeholder="Verify 12-digit UTR or UPI handle..."
                  className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all whitespace-nowrap cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.3)] shrink-0"
                >
                  Verify Now
                </button>
              </div>

              {/* Quick Search Result Feedback */}
              {searchResult && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 max-w-lg ${
                    searchResult.status === 'FOUND'
                      ? searchResult.matchedRecord?.assessment === 'SUSPICIOUS'
                        ? 'bg-red-950/40 border-red-800 text-red-300'
                        : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                      : searchResult.status === 'VALID_SYNTAX'
                      ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300'
                      : 'bg-amber-950/40 border-amber-800 text-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {searchResult.status === 'INVALID_FORMAT' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    <span>{searchResult.message}</span>
                  </div>
                  {searchResult.matchedRecord && (
                    <button
                      type="button"
                      onClick={() => onSelectAnalysis(searchResult.matchedRecord!)}
                      className="text-white underline hover:no-underline font-medium shrink-0 cursor-pointer"
                    >
                      View Audit
                    </button>
                  )}
                </motion.div>
              )}
            </form>

            {/* Quick Action Buttons for Full Scans */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onNavigate('analyze')}
                className="px-5 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all cursor-pointer"
              >
                <FileSearch className="w-4 h-4" />
                <span>Upload Screenshot</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onNavigate('camera')}
                className="px-5 py-2.5 text-xs font-medium text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4 text-amber-400" />
                <span>Open Live Camera</span>
              </motion.button>
            </div>

            {/* Trust Dividers & Compatible Channels matching reference design */}
            <div className="pt-6 flex flex-col sm:flex-row sm:items-center gap-4 text-xs text-slate-500 border-t border-slate-800/80">
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[11px]">
                Securing UPI Ecosystem
              </span>
              <div className="h-4 w-px bg-slate-800 hidden sm:block" />
              <div className="flex items-center gap-4 font-mono text-slate-400">
                <span>Google Pay</span>
                <span>·</span>
                <span>PhonePe</span>
                <span>·</span>
                <span>Paytm</span>
                <span>·</span>
                <span>BHIM UPI</span>
              </div>
            </div>
          </div>

          {/* Right Column: Organic Curved Backdrop + Interactive Cyber Shield & Floating Badges */}
          <div className="lg:col-span-5 relative flex items-center justify-center min-h-[420px] select-none">
            {/* Organic Curved Blob Backdrop echoing the reference mockup */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <svg
                viewBox="0 0 500 500"
                className="w-full h-full max-w-[460px] opacity-90 drop-shadow-[0_0_40px_rgba(245,158,11,0.15)]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="amberCurveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3" />
                    <stop offset="50%" stopColor="#EA580C" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#7C2D12" stopOpacity="0.05" />
                  </linearGradient>
                  <radialGradient id="shieldCenterGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Primary Organic Blob Curve */}
                <path
                  d="M410,130 C470,220 460,350 380,420 C300,490 170,470 100,400 C30,330 40,210 110,120 C180,30 350,40 410,130 Z"
                  fill="url(#amberCurveGrad)"
                  className="animate-pulse"
                  style={{ animationDuration: '6s' }}
                />

                {/* Secondary Accent Blob */}
                <path
                  d="M380,160 C430,230 420,330 350,380 C280,430 180,420 130,360 C80,300 90,200 150,140 C210,80 330,90 380,160 Z"
                  stroke="#F59E0B"
                  strokeWidth="1.5"
                  strokeDasharray="4 6"
                  opacity="0.4"
                />
              </svg>
            </div>

            {/* Central Interactive Cyber Fraud Shield Illustration */}
            <div className="relative z-10 w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
              {/* Outer Pulsing Radar Ring */}
              <div className="absolute inset-0 rounded-full border border-amber-400/20 animate-radar-pulse" />
              <div className="absolute inset-4 rounded-full border border-amber-400/30" />

              {/* Central Shield Container */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-40 h-40 sm:w-44 sm:h-44 rounded-3xl bg-slate-900/90 border border-amber-500/40 backdrop-blur-xl flex flex-col items-center justify-center shadow-[0_0_35px_rgba(245,158,11,0.25)] relative group cursor-pointer"
                onClick={() => onNavigate('analyze')}
              >
                <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-12 h-12 text-amber-400" />
                </div>
                <div className="mt-2 text-center">
                  <span className="text-xs font-bold text-white tracking-wider uppercase block">
                    Fake UPI Shield
                  </span>
                  <span className="text-[10px] text-amber-400/80 font-mono">
                    Real-Time Forensics
                  </span>
                </div>

                {/* Subtle Scanline Sweeper */}
                <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none opacity-40">
                  <div className="w-full h-1 bg-amber-400 shadow-[0_0_10px_#f59e0b] animate-scanline" />
                </div>
              </motion.div>
            </div>

            {/* Floating Metric Badge 1: Top Left (Matches reference image style) */}
            <div className="absolute -top-2 left-0 sm:left-4 z-20 animate-float hover:[animation-play-state:paused]">
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-white font-mono tabular-nums">
                    100k+ Audits
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Verified Settlements
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Metric Badge 2: Bottom Right (Matches reference image style) */}
            <div className="absolute -bottom-4 right-0 sm:right-4 z-20 animate-float-delayed hover:[animation-play-state:paused]">
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-emerald-400 font-mono tabular-nums">
                    50k+ Spoofs Flagged
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Zero Merchant Loss
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          KPI METRIC STRIP (Scroll-triggered cyber reveal animations)
         ────────────────────────────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Total Analyzed */}
        <motion.div
          initial={{ opacity: 0, y: 25, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.45, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="animate-float hover:[animation-play-state:paused]"
        >
          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="h-full p-5 rounded-2xl bg-slate-900/50 border border-slate-800/90 hover:border-slate-700 hover:shadow-[0_0_25px_rgba(255,255,255,0.05)] transition-all relative overflow-hidden group"
          >
            {/* Cyber Corner HUD Accent */}
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-slate-700 group-hover:border-slate-500 transition-colors" />
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-mono tracking-wide uppercase text-[11px] text-slate-400">Total Analyses</span>
              <Layers className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white font-mono tabular-nums">
              {loading ? '—' : total}
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5 font-mono">
              <span>Audit history records stored</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Flagged Suspicious */}
        <motion.div
          initial={{ opacity: 0, y: 25, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.45, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="animate-float-delayed hover:[animation-play-state:paused]"
        >
          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="h-full p-5 rounded-2xl bg-slate-900/50 border border-slate-800/90 hover:border-red-900/60 hover:shadow-[0_0_25px_rgba(239,68,68,0.18)] transition-all relative overflow-hidden group"
          >
            {/* Cyber Corner HUD Accent */}
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-red-500/40 group-hover:border-red-400 transition-colors" />
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-mono tracking-wide uppercase text-[11px] text-red-400/90">Flagged Suspicious</span>
              <ShieldAlert className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-red-400 font-mono tabular-nums">
              {loading ? '—' : suspicious}
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5 font-mono tabular-nums">
              <span className="text-red-400 font-medium">{rate}%</span>
              <span>of total uploads</span>
            </div>
          </motion.div>
        </motion.div>

        {/* No Obvious Issues */}
        <motion.div
          initial={{ opacity: 0, y: 25, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.45, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="animate-float-slow hover:[animation-play-state:paused]"
        >
          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="h-full p-5 rounded-2xl bg-slate-900/50 border border-slate-800/90 hover:border-emerald-900/60 hover:shadow-[0_0_25px_rgba(16,185,129,0.18)] transition-all relative overflow-hidden group"
          >
            {/* Cyber Corner HUD Accent */}
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-emerald-500/40 group-hover:border-emerald-400 transition-colors" />
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-mono tracking-wide uppercase text-[11px] text-emerald-400/90">No Obvious Issues</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono tabular-nums">
              {loading ? '—' : clean}
            </div>
            <div className="mt-2 text-xs text-slate-500 font-mono">
              <span>Valid metadata & syntax detected</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Inconclusive / Model Check */}
        <motion.div
          initial={{ opacity: 0, y: 25, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.45, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="animate-float-offset hover:[animation-play-state:paused]"
        >
          <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ duration: 0.2 }}
            className="h-full p-5 rounded-2xl bg-slate-900/50 border border-slate-800/90 hover:border-amber-900/60 hover:shadow-[0_0_25px_rgba(245,158,11,0.18)] transition-all relative overflow-hidden group"
          >
            {/* Cyber Corner HUD Accent */}
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-amber-500/40 group-hover:border-amber-400 transition-colors" />
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-mono tracking-wide uppercase text-[11px] text-amber-400/90">Inconclusive</span>
              <HelpCircle className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-amber-400 font-mono tabular-nums">
              {loading ? '—' : inconclusive}
            </div>
            <div className="mt-2 text-xs text-slate-500 font-mono">
              <span>Warrants secondary bank check</span>
            </div>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ──────────────────────────────────────────────────────────────────────────
          SERVICES / FORENSIC CAPABILITIES: Numbered Editorial Cards with Scroll Reveals
         ────────────────────────────────────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-800">
          <div>
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block font-mono">
              [Multi-Layer Cyber Inspection]
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
              Core Forensic Capabilities
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-md">
            Screenshots are scrutinized across spatial resolution, OCR character kerning, and rule-based heuristics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              step: '01. Ingestion',
              title: 'Safe Image Validation',
              desc: 'Validates header MIME magic bytes, checks for corrupted chunks, and assesses aspect ratio against standard Android/iOS displays.',
            },
            {
              step: '02. Computer Vision',
              title: 'OpenCV Preprocessing',
              desc: 'Applies Laplacian blur detection, CLAHE contrast enhancement, and adaptive Otsu thresholding to highlight doctored layers.',
            },
            {
              step: '03. Text Extraction',
              title: 'Tesseract OCR & Regex',
              desc: 'Parses the 12-digit UTR reference, INR currency symbols, payment status tokens, and standard UPI VPA handles (@okaxis, @ybl).',
            },
            {
              step: '04. Synthesis',
              title: 'CNN Neural & Heuristics',
              desc: 'Cross-checks extracted fields against known spoof APK signatures and evaluates CNN model weights with audit persistence in MySQL.',
            },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 25, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{
                delay: idx * 0.1,
                duration: 0.45,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="p-5 rounded-2xl bg-slate-900/30 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.08)] transition-all space-y-3 relative overflow-hidden group cursor-pointer"
            >
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-slate-800 group-hover:border-amber-400 transition-colors" />
              <span className="text-xs font-mono font-bold text-amber-400">{item.step}</span>
              <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                {item.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ──────────────────────────────────────────────────────────────────────────
          PRICING TIERS: Complete SaaS Landing Page Section
         ────────────────────────────────────────────────────────────────────────── */}
      <section className="p-8 sm:p-10 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center max-w-xl mx-auto space-y-3">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">
            Transparent Merchant Tiers
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Plans for Counters of Every Size
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Start free on your mobile browser or upgrade for high-throughput billing desk integrations.
          </p>

          {/* Monthly / Annual Billing Toggle */}
          <div className="pt-2 flex items-center justify-center gap-3">
            <div className="p-1 rounded-xl bg-slate-950 border border-slate-800 inline-flex items-center text-xs">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-4 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  billingCycle === 'annual'
                    ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Annual</span>
                <span className="text-[10px] bg-slate-900 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                  -20%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* Tier 1: Starter */}
          <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-slate-400">Merchant Starter</span>
                <div className="text-3xl font-bold text-white font-mono mt-1">₹0</div>
                <p className="text-xs text-slate-500 mt-1">Free forever for single counter stores</p>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Manual screenshot upload</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Live browser camera scanner</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Tesseract OCR & regex validation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>50 daily verification checks</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('analyze')}
              className="w-full py-2.5 text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors cursor-pointer text-center"
            >
              Start Free
            </button>
          </div>

          {/* Tier 2: Pro Retailer (Featured) */}
          <div className="p-6 rounded-2xl bg-slate-950/80 border-2 border-amber-500/50 flex flex-col justify-between space-y-6 relative shadow-[0_0_30px_rgba(245,158,11,0.15)]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm">
              Most Popular
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-amber-400">Pro Retailer</span>
                <div className="text-3xl font-bold text-white font-mono mt-1">
                  {billingCycle === 'monthly' ? '₹499' : '₹399'}
                  <span className="text-xs text-slate-400 font-normal"> / month</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">For multi-counter retail & restaurants</p>
              </div>

              <div className="space-y-2.5 text-xs text-slate-200 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Unlimited screenshot & camera audits</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Instant sound alerts for flagged fake APKs</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Persistent MySQL audit storage</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>CSV export for daily bank reconciliation</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => (onOpenContact ? onOpenContact() : onNavigate('analyze'))}
              className="w-full py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer text-center"
            >
              Get Pro Access
            </button>
          </div>

          {/* Tier 3: Enterprise */}
          <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-slate-400">Enterprise POS</span>
                <div className="text-3xl font-bold text-white font-mono mt-1">Custom</div>
                <p className="text-xs text-slate-500 mt-1">For supermarket chains & bank gateways</p>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>High-speed REST API & Webhooks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Custom CNN model fine-tuning</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>On-premise Docker & Windows deployment</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>24/7 dedicated FinTech security SLA</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => (onOpenContact ? onOpenContact() : onNavigate('docs'))}
              className="w-full py-2.5 text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors cursor-pointer text-center"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          RECENT AUDITS STREAM (Clickable to view forensics)
         ────────────────────────────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/20 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Recent Payment Screenshot Audits</h2>
            <p className="text-xs text-slate-400 mt-0.5">Click any record to inspect forensic details and extracted OCR fields</p>
          </div>
          <button
            onClick={() => onNavigate('history')}
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors cursor-pointer font-medium"
          >
            <span>View all audits</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {stats?.recent_activity && stats.recent_activity.length > 0 ? (
          <div className="divide-y divide-slate-800/80">
            {stats.recent_activity.map((item) => {
              const isSuspicious = item.assessment === 'SUSPICIOUS';
              const isClean = item.assessment === 'NO_OBVIOUS_ISSUES';
              return (
                <div
                  key={item.analysis_id}
                  onClick={() => onSelectAnalysis(item)}
                  className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center shrink-0">
                      {isSuspicious ? (
                        <ShieldAlert className="w-4 h-4 text-red-400" />
                      ) : isClean ? (
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <HelpCircle className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white group-hover:text-amber-400 transition-colors">
                          {item.original_filename}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="text-xs font-mono text-slate-400">{item.image_dimensions}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span>UTR: {item.extracted_fields?.utr || 'Not found'}</span>
                        <span aria-hidden="true">·</span>
                        <span>Payee: {item.extracted_fields?.recipient_name || item.extracted_fields?.upi_id || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 sm:self-center">
                    <div className="text-right">
                      <div className="text-sm font-bold text-white font-mono tabular-nums">
                        {item.extracted_fields?.amount ? `₹ ${item.extracted_fields.amount}` : '—'}
                      </div>
                      <div className="text-xs text-slate-500 font-mono tabular-nums">
                        {item.processing_duration_ms}ms
                      </div>
                    </div>

                    <div
                      className={`text-xs font-medium px-2.5 py-1 rounded-md text-center ${
                        isSuspicious
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : isClean
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {item.assessment.replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 text-xs">
            No audits recorded yet. Upload your first payment screenshot to begin analysis.
          </div>
        )}
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          RESOURCES & FRAUD DEFENSE GUIDES
         ────────────────────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Merchant Fraud Prevention Resources</h3>
          </div>
          <button
            onClick={() => onNavigate('docs')}
            className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Technical Docs
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={() => onNavigate('how_it_works')}
            className="p-4 rounded-xl bg-slate-900/30 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
          >
            <span className="text-[10px] uppercase font-mono text-amber-400">Guide 01</span>
            <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors mt-1">
              Top 5 FakePay & Prank APK Signatures
            </h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              How spoof applications forge UPI receipts with incorrect font kerning, missing VPA domains, and truncated UTR numbers.
            </p>
          </div>

          <div
            onClick={() => onNavigate('model')}
            className="p-4 rounded-xl bg-slate-900/30 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
          >
            <span className="text-[10px] uppercase font-mono text-amber-400">Guide 02</span>
            <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors mt-1">
              CNN Convolutional Weight Training
            </h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Organizing genuine versus spoof dataset folders and compiling MobileNetV2 / custom Keras classifiers.
            </p>
          </div>

          <div
            onClick={() => onNavigate('docs')}
            className="p-4 rounded-xl bg-slate-900/30 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
          >
            <span className="text-[10px] uppercase font-mono text-amber-400">Guide 03</span>
            <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors mt-1">
              Windows & MySQL 8.0 Setup Guide
            </h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Step-by-step instructions for installing Tesseract-OCR, configuring Python 3.11 virtualenvs, and running schema.sql.
            </p>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          BOTTOM ACTION BANNER (Contact Modal Trigger)
         ────────────────────────────────────────────────────────────────────────── */}
      <section className="p-8 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-slate-900 border border-amber-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <h3 className="text-lg font-bold text-white">Need Custom Counter POS Integration?</h3>
          <p className="text-xs text-slate-400 max-w-lg">
            Connect our automated Python OCR verification service directly to your billing software or WhatsApp merchant bot.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {onOpenContact && (
            <button
              onClick={onOpenContact}
              className="px-5 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] cursor-pointer"
            >
              Contact Engineering
            </button>
          )}
          <button
            onClick={() => onNavigate('analyze')}
            className="px-5 py-2.5 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            Upload Test Receipt
          </button>
        </div>
      </section>
    </div>
  );
};
