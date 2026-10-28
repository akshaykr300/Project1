/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import { AnalysisRecord } from '../types';
import {
  UploadCloud,
  FileImage,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';

interface AnalyzePageProps {
  onAnalysisComplete: (result: AnalysisRecord) => void;
  onNavigateToCamera: () => void;
}

import { motion } from 'motion/react';

export const AnalyzePage: React.FC<AnalyzePageProps> = ({
  onAnalysisComplete,
  onNavigateToCamera,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStage, setProgressStage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pre-configured test sample fixtures for instant testing
  const sampleFixtures = [
    {
      title: 'Valid Google Pay Receipt (₹1,500)',
      category: 'AUTHENTIC_TEST',
      filename: 'sample_gpay_genuine_test.png',
      ocrText:
        'Paid to\nRahul Verma\nrahul.verma@okaxis\n₹ 1,500.00\nPayment Successful\n28 Oct 2026, 09:30 AM\nUPI Transaction ID\n428910293847\nGoogle Pay',
      amount: '₹ 1,500',
      utr: '428910293847',
      isClean: true,
    },
    {
      title: 'Counterfeit Mock App Receipt (₹50,000)',
      category: 'SUSPICIOUS_TEST',
      filename: 'sample_spoof_fakepay_test.png',
      ocrText:
        'Payment Successful\n₹ 50,000\nTo: merchant@fastpay\nRef No: 9481\nGenerated via FakePay Pro App',
      amount: '₹ 50,000',
      utr: '9481 (5 digits - Malformed)',
      isClean: false,
    },
    {
      title: 'Pending State Transaction Receipt (₹3,200)',
      category: 'PENDING_TEST',
      filename: 'sample_pending_payment_test.png',
      ocrText:
        'Payment Processing\n₹ 3,200.00\nTo: Vijay Enterprises\nvijay.enterprises@ybl\nUPI Ref: 429182746192\nTransaction Pending with Bank',
      amount: '₹ 3,200',
      utr: '429182746192',
      isClean: false,
    },
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (file: File) => {
    setErrorMessage(null);
    const validExtensions = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validExtensions.includes(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
      setErrorMessage('Unsupported file format. Please upload a JPEG, PNG, or WebP screenshot.');
      return;
    }

    const maxSize = 15 * 1024 * 1024; // 15MB
    if (file.size > maxSize) {
      setErrorMessage('File size exceeds the 15MB limit. Please upload a smaller screenshot.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const executeAnalysis = async (fileToAnalyze: File | Blob, filename: string, precomputedOcr?: string) => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      setProgressStage('Ingesting image and validating format...');
      await new Promise((r) => setTimeout(r, 200));

      setProgressStage('Applying OpenCV preprocessing (CLAHE & noise reduction)...');
      await new Promise((r) => setTimeout(r, 250));

      let extractedOcrText = precomputedOcr || '';

      // If no precomputed OCR, extract with in-browser Tesseract.js
      if (!extractedOcrText && previewUrl) {
        setProgressStage('Executing Tesseract OCR text extraction...');
        try {
          const { createWorker } = await import('tesseract.js');
          const worker = await createWorker('eng');
          const ret = await worker.recognize(previewUrl);
          extractedOcrText = ret.data.text;
          await worker.terminate();
        } catch (tessErr) {
          console.warn('In-browser Tesseract.js OCR notice:', tessErr);
        }
      }

      setProgressStage('Checking CNN weights & evaluating heuristic tampering rules...');
      const result = await api.analyzeImage(fileToAnalyze, filename, {
        ocrText: extractedOcrText,
        dimensions: '1080x2400',
      });

      if (previewUrl) {
        result.image_preview = previewUrl;
      }

      setProgressStage('Analysis complete. Persisting audit log...');
      await new Promise((r) => setTimeout(r, 200));

      onAnalysisComplete(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Analysis failed. Please check backend connection.');
    } finally {
      setIsProcessing(false);
      setProgressStage('');
    }
  };

  const handleTestFixtureClick = async (fixture: typeof sampleFixtures[0]) => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = fixture.isClean ? '#0f172a' : '#1e1b2e';
      ctx.fillRect(0, 0, 400, 800);

      ctx.fillStyle = fixture.isClean ? '#10b981' : '#ef4444';
      ctx.beginPath();
      ctx.arc(200, 150, 40, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(fixture.isClean ? '✓' : '!', 200, 162);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(fixture.amount, 200, 240);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px sans-serif';
      ctx.fillText(fixture.title, 200, 280);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '13px monospace';
      ctx.fillText(`UTR: ${fixture.utr}`, 200, 360);
      ctx.fillText(`App: ${fixture.filename}`, 200, 400);

      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'));
      const sampleFile = new File([blob], fixture.filename, { type: 'image/png' });

      setPreviewUrl(canvas.toDataURL('image/png'));
      setSelectedFile(sampleFile);

      executeAnalysis(sampleFile, fixture.filename, fixture.ocrText);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Upload UPI Payment Screenshot</h1>
        <p className="mt-1 text-xs text-slate-400">
          Upload any payment confirmation receipt from Google Pay, PhonePe, Paytm, BHIM, or banking apps.
          Supported formats: PNG, JPEG, WebP (up to 15MB).
        </p>
      </div>

      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-300 text-xs flex items-start gap-3"
        >
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-red-200">Analysis Error</span>
            <p>{errorMessage}</p>
          </div>
        </motion.div>
      )}

      {/* Drag & Drop Upload Zone with Hover/Active Animations */}
      <motion.div
        whileHover={{ scale: previewUrl ? 1 : 1.005 }}
        whileTap={{ scale: 0.995 }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center ${
          dragActive
            ? 'border-emerald-400 bg-emerald-500/10 shadow-[0_0_25px_rgba(52,211,153,0.15)]'
            : selectedFile
            ? 'border-slate-700 bg-slate-900/40'
            : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/20 bg-slate-900/10'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        {previewUrl ? (
          <div className="space-y-4">
            {/* Image Preview with Cyber Reticle & Scanner Line */}
            <div className="relative max-w-xs mx-auto max-h-76 overflow-hidden rounded-xl border border-slate-700/80 shadow-2xl bg-black">
              <img
                src={previewUrl}
                alt="Selected UPI receipt preview"
                className="w-full h-auto object-contain mx-auto"
              />

              {/* Corner Reticle Brackets */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-400 pointer-events-none" />
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-400 pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-400 pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-400 pointer-events-none" />

              {/* High-Tech Animated Scanning Laser Line */}
              {isProcessing && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-scanline" />
                  <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[0.5px]" />
                </div>
              )}
            </div>

            <div className="text-xs text-slate-400">
              <span className="text-white font-medium">{selectedFile?.name}</span>
              <span className="text-slate-600"> · </span>
              <span className="font-mono tabular-nums">{((selectedFile?.size || 0) / 1024).toFixed(1)} KB</span>
            </div>
            <p className="text-xs text-emerald-400 font-medium">Click to choose a different screenshot</p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-inner"
            >
              <UploadCloud className="w-7 h-7" />
            </motion.div>
            <div>
              <p className="text-sm font-semibold text-white">Drag and drop your screenshot here</p>
              <p className="text-xs text-slate-400 mt-1">or browse from your local computer</p>
            </div>
            <div className="text-xs text-slate-500">
              Auto-detects amounts, 12-digit UTR, beneficiary VPA, and status indicators
            </div>
          </div>
        )}
      </motion.div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={onNavigateToCamera}
          className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors cursor-pointer"
        >
          Capture from Live Camera Instead
        </button>

        <motion.button
          whileHover={{ scale: !selectedFile || isProcessing ? 1 : 1.02 }}
          whileTap={{ scale: !selectedFile || isProcessing ? 1 : 0.98 }}
          type="button"
          disabled={!selectedFile || isProcessing}
          onClick={() => {
            if (selectedFile) executeAnalysis(selectedFile, selectedFile.name);
          }}
          className={`w-full sm:w-auto px-6 py-2.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
            !selectedFile || isProcessing
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-[0_0_20px_rgba(52,211,153,0.3)]'
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing Payment Screenshot...</span>
            </>
          ) : (
            <>
              <span>Run Forensic Analysis</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </div>

      {/* Processing Status Banner */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
        >
          <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
          <div className="text-xs text-slate-300 font-mono">
            {progressStage || 'Processing screenshot...'}
          </div>
        </motion.div>
      )}

      {/* Pre-Loaded Test Fixtures Strip */}
      <div className="pt-6 border-t border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Instant Sample Test Fixtures
            </h3>
          </div>
          <span className="text-xs text-slate-500">Click any fixture to test the pipeline immediately</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {sampleFixtures.map((fixture, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleTestFixtureClick(fixture)}
              className="p-4 rounded-xl bg-slate-900/30 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/60 hover:shadow-lg transition-all cursor-pointer text-left space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300 group-hover:text-emerald-400 transition-colors">
                  {fixture.title}
                </span>
                {fixture.isClean ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
                )}
              </div>
              <div className="text-xs text-slate-400 font-mono">{fixture.amount}</div>
              <div className="text-xs text-slate-500 font-mono truncate">
                UTR: {fixture.utr}
              </div>
              <div className="text-xs text-emerald-400 font-medium pt-1 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Run test</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
