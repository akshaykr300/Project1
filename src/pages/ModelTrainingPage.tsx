/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { TrainingDatasetInfo, TrainingJob } from '../types';
import {
  Cpu,
  Layers,
  Play,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  Terminal,
  Settings,
  FolderOpen,
  Info,
  Clock
} from 'lucide-react';

export const ModelTrainingPage: React.FC = () => {
  const [datasetInfo, setDatasetInfo] = useState<TrainingDatasetInfo | null>(null);
  const [modelStatus, setModelStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeJob, setActiveJob] = useState<TrainingJob | null>(null);
  const [trainingParams, setTrainingParams] = useState({
    epochs: 10,
    batch_size: 16,
    learning_rate: 0.001,
    train_split: 0.70,
    val_split: 0.15,
    test_split: 0.15,
  });
  const [startingTraining, setStartingTraining] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dInfo, mInfo] = await Promise.all([
        api.getTrainingDataset(),
        api.getModelStatus(),
      ]);
      setDatasetInfo(dInfo);
      setModelStatus(mInfo);
    } catch (e: any) {
      console.error('Error loading model page data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Poll active training job
  useEffect(() => {
    let interval: any = null;
    if (activeJob && (activeJob.status === 'RUNNING' || activeJob.status === 'PENDING')) {
      interval = setInterval(async () => {
        try {
          const updated = await api.getTrainingJobStatus(activeJob.job_id);
          setActiveJob(updated);
          if (updated.status === 'COMPLETED' || updated.status === 'FAILED') {
            loadData();
          }
        } catch (e) {
          console.error('Polling error:', e);
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeJob]);

  const handleStartTraining = async () => {
    setStatusError(null);
    setStartingTraining(true);
    try {
      const job = await api.startTraining(trainingParams);
      setActiveJob(job);
    } catch (err: any) {
      setStatusError(err.message || 'Unable to start training job. Please verify dataset.');
    } finally {
      setStartingTraining(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            CNN Model Registry & Training Pipeline
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Train and inspect TensorFlow / Keras convolutional models for pixel-level payment tampering detection.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="px-3 py-1.5 text-xs text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Model Status Card */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Active Inference Classifier</span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                    modelStatus?.disk_status?.is_trained
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {modelStatus?.disk_status?.status || 'MODEL_NOT_TRAINED'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Architecture: <span className="font-mono text-slate-300">{modelStatus?.architecture || 'CustomCNN_v1'}</span>
                {' · '}Input shape: <span className="font-mono text-slate-300">{modelStatus?.input_shape || '(224, 224, 3)'}</span>
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            {modelStatus?.disk_status?.is_trained ? (
              <span className="text-emerald-400">Weights file loaded</span>
            ) : (
              <span className="text-amber-400">Awaiting training execution</span>
            )}
          </div>
        </div>

        {/* Cautious ML Disclaimer */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-slate-200">Machine Learning Generalization Notice:</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              A small dataset or synthetic screenshots cannot establish real-world accuracy across diverse phone screens,
              ambient lighting, and UPI app variants. A trained CNN classifier provides auxiliary edge-tampering signals,
              not legal proof that money was settled into your bank account.
            </p>
          </div>
        </div>
      </div>

      {/* Dataset Readiness Audit */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/20">
          <div className="text-xs text-slate-500 mb-1">Genuine Class Samples</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            {datasetInfo?.genuine_count ?? 0}
          </div>
          <div className="text-xs text-slate-400 mt-1">Directory: data/dataset/genuine</div>
        </div>

        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/20">
          <div className="text-xs text-slate-500 mb-1">Suspicious Class Samples</div>
          <div className="text-2xl font-bold text-red-400 font-mono tabular-nums">
            {datasetInfo?.suspicious_count ?? 0}
          </div>
          <div className="text-xs text-slate-400 mt-1">Directory: data/dataset/suspicious</div>
        </div>

        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/20">
          <div className="text-xs text-slate-500 mb-1">Class Imbalance Ratio</div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            {datasetInfo?.class_imbalance_ratio ?? 1.0} : 1
          </div>
          <div className="text-xs text-slate-400 mt-1">Target ratio: &lt; 1.5 : 1</div>
        </div>
      </div>

      {/* Training Configuration & Trigger */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30 space-y-6">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">CNN Training Hyperparameters</h2>
        </div>

        {statusError && (
          <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800 text-xs text-red-300">
            {statusError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Epochs (1 to 50)</label>
            <input
              type="number"
              min="1"
              max="50"
              value={trainingParams.epochs}
              onChange={(e) => setTrainingParams({ ...trainingParams, epochs: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Batch Size</label>
            <select
              value={trainingParams.batch_size}
              onChange={(e) => setTrainingParams({ ...trainingParams, batch_size: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono"
            >
              <option value="8">8</option>
              <option value="16">16</option>
              <option value="32">32</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Adam Learning Rate</label>
            <input
              type="number"
              step="0.0001"
              value={trainingParams.learning_rate}
              onChange={(e) => setTrainingParams({ ...trainingParams, learning_rate: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono"
            />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            Split strategy: <span className="font-mono text-slate-200">70% Train · 15% Val · 15% Held-Out Test</span>
          </div>

          <button
            onClick={handleStartTraining}
            disabled={startingTraining || activeJob?.status === 'RUNNING'}
            className={`px-5 py-2.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              startingTraining || activeJob?.status === 'RUNNING'
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-sm'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>
              {activeJob?.status === 'RUNNING' ? 'Training in Progress...' : 'Start CNN Training Job'}
            </span>
          </button>
        </div>
      </div>

      {/* Live Training Job Monitor */}
      {activeJob && (
        <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-white">Job Monitor: {activeJob.job_id}</span>
            </div>
            <span
              className={`font-mono px-2 py-0.5 rounded text-[10px] ${
                activeJob.status === 'COMPLETED'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : activeJob.status === 'RUNNING'
                  ? 'bg-indigo-500/10 text-indigo-400 animate-pulse'
                  : 'bg-red-500/10 text-red-400'
              }`}
            >
              {activeJob.status}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-900 h-1.5">
            <div
              className="bg-emerald-400 h-1.5 transition-all duration-300"
              style={{ width: `${activeJob.progress_percent}%` }}
            />
          </div>

          <div className="p-4">
            <pre className="p-4 rounded-lg bg-slate-900/80 border border-slate-800/80 text-[11px] font-mono text-slate-300 whitespace-pre-wrap max-h-60 overflow-y-auto">
              {activeJob.logs || 'Awaiting worker output...'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
