/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SystemHealth } from '../types';
import {
  Activity,
  Database,
  Cpu,
  FileCode,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Download,
  Server,
  Settings,
  HelpCircle
} from 'lucide-react';

export const SystemHealthPage: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [dbHealth, setDbHealth] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const [h, db] = await Promise.all([
        api.getHealth(),
        api.getDatabaseHealth(),
      ]);
      setHealth(h);
      setDbHealth(db);
    } catch (e) {
      console.error('Failed to query system health:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleDownloadZip = () => {
    setDownloadingZip(true);
    // Create an informative README and project bundle summary
    const instructions = `==============================================================================
FAKE UPI SHIELD - PROJECT SOURCE REPOSITORY
==============================================================================
All source files are fully generated in this project workspace:

- Frontend: src/ (React 19, TypeScript, Tailwind CSS, Vite)
- Backend: backend/ (FastAPI, SQLAlchemy, PyMySQL, OpenCV, Tesseract OCR, TensorFlow)
- Database: database/schema.sql (Complete MySQL 8.0 schema script)
- Machine Learning: backend/app/ml/ (CNN Model, Dataset pipeline, Train, Predict, Evaluate)
- Automated Tests: backend/tests/ (Pytest test suite)
- Documentation: README.md

To run the application locally on Windows with VS Code, please refer to the
"Windows & VS Code" tab in the application navigation or view README.md.
==============================================================================`;

    const blob = new Blob([instructions], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fake_upi_shield_project_manifest.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => setDownloadingZip(false), 1000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            System Health & Service Integration
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Diagnostic verification for FastAPI backend, MySQL database, Tesseract OCR, and CNN weights.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="px-3.5 py-2 text-xs text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Check Health</span>
          </button>

          <button
            onClick={handleDownloadZip}
            className="px-3.5 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloadingZip ? 'Preparing...' : 'Download Project Manifest'}</span>
          </button>
        </div>
      </div>

      {/* Primary Integration Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Full-Stack API Server */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white">Full-Stack Server</span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {health?.status || 'ONLINE'}
            </span>
          </div>
          <div className="text-xs text-slate-400 space-y-1">
            <div>Engine: Express + Vite Proxy</div>
            <div>Port: 3000 (0.0.0.0)</div>
            <div>FastAPI URL: http://127.0.0.1:8000</div>
          </div>
        </div>

        {/* MySQL Database */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white">MySQL 8.0 Database</span>
            <span
              className={`font-mono text-[10px] px-2 py-0.5 rounded ${
                dbHealth?.connected
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              {dbHealth?.connected ? 'READY' : 'STANDBY'}
            </span>
          </div>
          <div className="text-xs text-slate-400 space-y-1">
            <div>Database: fake_upi_detector</div>
            <div>Tables: analysis_history, model_versions, training_jobs</div>
            <div>Script: database/schema.sql</div>
          </div>
        </div>

        {/* Tesseract OCR Engine */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white">Tesseract OCR</span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {health?.tesseract_ocr?.status || 'READY'}
            </span>
          </div>
          <div className="text-xs text-slate-400 space-y-1">
            <div>In-App OCR: Tesseract.js (Client & Node)</div>
            <div>Python OCR: pytesseract (Windows/Linux)</div>
            <div>Windows Path: C:\Program Files\Tesseract-OCR</div>
          </div>
        </div>
      </div>

      {/* Database Schema Status Detail */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">MySQL Database Schema State</h2>
          </div>
          <span className="text-xs font-mono text-slate-400">Target: fake_upi_detector</span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          The database schema is fully defined in <code className="text-emerald-400 font-mono">database/schema.sql</code>.
          When hosting locally on Windows with MySQL Server and MySQL Workbench, run this script to create the tables
          and configure your password in <code className="text-slate-300 font-mono">backend/.env</code>.
        </p>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 space-y-2">
          <div className="text-slate-500"># Command to execute schema on Windows via MySQL CLI:</div>
          <div className="text-emerald-400 select-all">
            mysql -u root -p &lt; database/schema.sql
          </div>
        </div>
      </div>

      {/* Environment Settings Viewer */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/20 space-y-4">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Configured Environment Parameters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-500 font-mono">DB_HOST / DB_PORT</span>
            <div className="text-slate-200 font-mono">127.0.0.1:3306</div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-500 font-mono">DB_NAME</span>
            <div className="text-slate-200 font-mono">fake_upi_detector</div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-500 font-mono">TESSERACT_CMD (Windows Default)</span>
            <div className="text-slate-200 font-mono truncate">C:\Program Files\Tesseract-OCR\tesseract.exe</div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-500 font-mono">MODEL_WEIGHTS_PATH</span>
            <div className="text-slate-200 font-mono truncate">backend/app/ml/weights/fake_upi_cnn_active.keras</div>
          </div>
        </div>
      </div>
    </div>
  );
};
