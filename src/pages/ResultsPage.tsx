/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import { AnalysisRecord } from '../types';
import {
  ShieldAlert,
  ShieldCheck,
  HelpCircle,
  AlertTriangle,
  FileText,
  Cpu,
  Layers,
  Download,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Copy,
  Check
} from 'lucide-react';

interface ResultsPageProps {
  result: AnalysisRecord;
  onDelete: (analysisId: string) => void;
  onNewAnalysis: () => void;
}

import { motion, AnimatePresence } from 'motion/react';

export const ResultsPage: React.FC<ResultsPageProps> = ({
  result,
  onDelete,
  onNewAnalysis,
}) => {
  const [showRawOcr, setShowRawOcr] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isSuspicious = result.assessment === 'SUSPICIOUS';
  const isClean = result.assessment === 'NO_OBVIOUS_ISSUES';
  const isInconclusive = result.assessment === 'INCONCLUSIVE';

  const copyAnalysisId = () => {
    navigator.clipboard.writeText(result.analysis_id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const exportJsonReport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `audit_report_${result.analysis_id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Action & Breadcrumb Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Audit Report</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-300">{result.analysis_id}</span>
            <button
              onClick={copyAnalysisId}
              className="p-1 hover:text-white transition-colors cursor-pointer"
              title="Copy ID"
            >
              {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            Forensic Screenshot Assessment
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={exportJsonReport}
            className="px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onNewAnalysis}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-[0_0_15px_rgba(52,211,153,0.3)] transition-all cursor-pointer"
          >
            New Analysis
          </motion.button>
        </div>
      </div>

      {/* Primary Assessment Banner with Animated Presence & Soft Glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`p-6 rounded-2xl border relative overflow-hidden ${
          isSuspicious
            ? 'bg-red-950/20 border-red-800/80 shadow-[0_0_30px_rgba(239,68,68,0.08)]'
            : isClean
            ? 'bg-emerald-950/20 border-emerald-800/80 shadow-[0_0_30px_rgba(16,185,129,0.08)]'
            : 'bg-amber-950/20 border-amber-800/80 shadow-[0_0_30px_rgba(245,158,11,0.08)]'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="relative">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 z-10 relative ${
                  isSuspicious
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : isClean
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {isSuspicious ? (
                  <ShieldAlert className="w-6 h-6" />
                ) : isClean ? (
                  <ShieldCheck className="w-6 h-6" />
                ) : (
                  <HelpCircle className="w-6 h-6" />
                )}
              </div>
              {/* Subtle ambient pulse behind icon */}
              <div
                className={`absolute inset-0 rounded-xl blur-md opacity-40 -z-0 ${
                  isSuspicious ? 'bg-red-500' : isClean ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Assessment Verdict</span>
                <span className="text-slate-600">·</span>
                <span className="text-xs text-slate-400">{new Date(result.created_at).toLocaleString()}</span>
              </div>
              <h2
                className={`text-2xl font-bold tracking-tight ${
                  isSuspicious ? 'text-red-400' : isClean ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {result.assessment.replace(/_/g, ' ')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                {isSuspicious
                  ? 'Available visual, textual, and heuristic evidence warrants caution. One or more high-risk anomalies or missing critical identifiers were detected.'
                  : isClean
                  ? 'No configured warnings or obvious tampering anomalies were detected in the visible image fields. Note: This does not guarantee bank settlement.'
                  : 'Evidence is insufficient or conflicting. Crucial payment metadata could not be fully substantiated.'}
              </p>
            </div>
          </div>

          <div className="text-left md:text-right shrink-0 pt-2 md:pt-0">
            <div className="text-xs text-slate-400">Analysis Duration</div>
            <div className="text-xl font-bold text-white font-mono tabular-nums">
              {result.processing_duration_ms} ms
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Resolution: {result.image_dimensions}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Grid: Preview on Left, Extracted Fields & Diagnostics on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Screenshot Visual Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/30 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Receipt Image Preview</span>
              <span className="text-slate-500 font-mono text-[11px]">{result.image_dimensions}</span>
            </div>
            <div className="p-4 bg-black/40 flex items-center justify-center">
              {result.image_preview ? (
                <img
                  src={result.image_preview}
                  alt="Analyzed Screenshot"
                  className="max-h-96 w-auto object-contain rounded-lg shadow-md border border-slate-800"
                />
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                  <FileText className="w-8 h-8 text-slate-600" />
                  <span>Preview stored in local memory</span>
                </div>
              )}
            </div>
            <div className="px-4 py-2.5 bg-slate-900/50 text-[11px] text-slate-500 border-t border-slate-800 font-mono truncate">
              File: {result.original_filename}
            </div>
          </div>

          {/* Critical Bank Notice */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-2 text-xs">
            <span className="font-semibold text-slate-200">Legal & Verification Notice:</span>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px] leading-relaxed">
              {result.limitations.map((lim, i) => (
                <li key={i}>{lim}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: Detailed Structured Findings */}
        <div className="lg:col-span-7 space-y-6">
          {/* Key Extracted Details Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white">OCR Extracted Payment Details</h3>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                Status: {result.ocr_status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Transaction Amount</span>
                <span className="text-lg font-bold text-white font-mono mt-0.5 block">
                  {result.extracted_fields?.amount ? `₹ ${result.extracted_fields.amount}` : 'Not extracted'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">UPI Reference ID (UTR)</span>
                <span
                  className={`text-sm font-semibold font-mono mt-0.5 block ${
                    result.extracted_fields?.utr?.length === 12 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {result.extracted_fields?.utr || 'Missing / Not detected'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Beneficiary / Payee VPA</span>
                <span className="font-mono text-slate-200 mt-0.5 block truncate">
                  {result.extracted_fields?.upi_id || 'Not identified'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Recipient Name</span>
                <span className="font-medium text-slate-200 mt-0.5 block truncate">
                  {result.extracted_fields?.recipient_name || 'Not detected'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Extracted Timestamp</span>
                <span className="font-mono text-slate-200 mt-0.5 block">
                  {result.extracted_fields?.timestamp || 'Not detected'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Payment Status Keyword</span>
                <span
                  className={`font-medium mt-0.5 block ${
                    result.extracted_fields?.status_keyword === 'PAID' || result.extracted_fields?.status_keyword === 'COMPLETED'
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                >
                  {result.extracted_fields?.status_keyword || 'Unclear'}
                </span>
              </div>
            </div>

            {/* Toggle Raw OCR Output */}
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowRawOcr(!showRawOcr)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>{showRawOcr ? 'Hide Raw OCR Text' : 'View Full Extracted OCR Text'}</span>
                {showRawOcr ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showRawOcr && (
                <pre className="mt-2 p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {result.raw_ocr_text || 'No text extracted.'}
                </pre>
              )}
            </div>
          </div>

          {/* Reasons & Specific Risk Indicators */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white">Analysis Findings & Reasons</h3>
            <div className="space-y-2">
              {result.reasons.map((reason, index) => {
                const isBad =
                  reason.toLowerCase().includes('missing') ||
                  reason.toLowerCase().includes('invalid') ||
                  reason.toLowerCase().includes('spoof') ||
                  reason.toLowerCase().includes('prank') ||
                  reason.toLowerCase().includes('failed');
                return (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                      isBad
                        ? 'bg-red-950/20 border-red-900/40 text-red-300'
                        : 'bg-slate-900/40 border-slate-800 text-slate-300'
                    }`}
                  >
                    {isBad ? (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    )}
                    <span>{reason}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CNN Model & Computer Vision Diagnostics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CNN Status Card */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">CNN Model Inference</span>
                <span
                  className={`px-2 py-0.5 rounded font-mono text-[10px] ${
                    result.cnn_result.status === 'INFERENCE_SUCCESS'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-amber-500/10 text-amber-400'
                  }`}
                >
                  {result.cnn_result.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {result.cnn_result.disclaimer}
              </p>
              {result.cnn_result.probabilities && (
                <div className="text-xs font-mono space-y-1 pt-1 text-slate-300">
                  <div>Genuine: {(result.cnn_result.probabilities.genuine * 100).toFixed(1)}%</div>
                  <div>Suspicious: {(result.cnn_result.probabilities.suspicious * 100).toFixed(1)}%</div>
                </div>
              )}
            </div>

            {/* OpenCV Preprocessing Diagnostics */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/20 space-y-2 text-xs">
              <span className="font-semibold text-slate-300 block">OpenCV Diagnostics</span>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono">
                <div>Aspect Ratio: {result.preprocessing.aspect_ratio}</div>
                <div>Contrast: {result.preprocessing.contrast_score}</div>
                <div>Sharpness: {result.preprocessing.blur_score}</div>
                <div>CLAHE: {result.preprocessing.clahe_applied ? 'Applied' : 'Skipped'}</div>
              </div>
              <div className="text-[11px] text-slate-500 pt-1">
                Aspect ratio matches standard mobile viewport: {result.preprocessing.is_standard_mobile_ratio ? 'Yes' : 'No'}
              </div>
            </div>
          </div>

          {/* Safe Record Deletion */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              SHA256: <code className="font-mono text-slate-400">{result.file_hash.slice(0, 16)}...</code>
            </span>

            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-400">Confirm permanent deletion?</span>
                <button
                  onClick={() => onDelete(result.analysis_id)}
                  className="px-2.5 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded transition-colors cursor-pointer"
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2.5 py-1 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Audit Record</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
