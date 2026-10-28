/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ExtractedFields {
  amount: string | null;
  currency: string;
  upi_id: string | null;
  utr: string | null;
  timestamp: string | null;
  recipient_name: string | null;
  status_keyword: string | null;
  ocr_confidence: number | null;
}

export interface PreprocessingDiagnostics {
  original_width: number;
  original_height: number;
  aspect_ratio: number;
  channels: number;
  is_standard_mobile_ratio: boolean;
  contrast_score: number;
  blur_score: number;
  clahe_applied: boolean;
  status: string;
}

export interface CNNInferenceResult {
  status: 'MODEL_NOT_TRAINED' | 'INFERENCE_SUCCESS' | 'INFERENCE_FAILED' | 'DISABLED';
  model_version: string | null;
  prediction: 'genuine' | 'suspicious' | null;
  probabilities: { genuine: number; suspicious: number } | null;
  confidence: number | null;
  disclaimer: string;
}

export interface HeuristicFindings {
  has_valid_amount: boolean;
  has_valid_utr: boolean;
  has_upi_id: boolean;
  has_timestamp: boolean;
  suspicious_status_found: boolean;
  font_inconsistency_score: number;
  resolution_warning: boolean;
  tampering_indicators: string[];
}

export type AssessmentCategory = 'SUSPICIOUS' | 'NO_OBVIOUS_ISSUES' | 'INCONCLUSIVE' | 'ANALYSIS_INCOMPLETE';

export interface AnalysisRecord {
  id: number;
  analysis_id: string;
  original_filename: string;
  file_hash: string;
  file_size_bytes: number;
  image_dimensions: string;
  ocr_status: string;
  extracted_fields: ExtractedFields;
  raw_ocr_text: string;
  preprocessing: PreprocessingDiagnostics;
  cnn_result: CNNInferenceResult;
  heuristics: HeuristicFindings;
  assessment: AssessmentCategory;
  reasons: string[];
  limitations: string[];
  processing_duration_ms: number;
  created_at: string;
  image_preview?: string;
}

export interface DashboardStats {
  total_analyses: number;
  suspicious_count: number;
  no_obvious_issues_count: number;
  inconclusive_count: number;
  analysis_incomplete_count: number;
  suspicious_rate_percentage: number;
  recent_activity: AnalysisRecord[];
  model_active: boolean;
  active_model_version: string | null;
  database_connected: boolean;
}

export interface TrainingDatasetInfo {
  dataset_ready: boolean;
  genuine_count: number;
  suspicious_count: number;
  total_samples: number;
  dataset_path: string;
  class_imbalance_ratio: number;
  warnings: string[];
}

export interface TrainingJob {
  job_id: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  current_epoch: number;
  total_epochs: number;
  progress_percent: number;
  logs: string;
  error_details: string | null;
  model_version_name: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface SystemHealth {
  status: string;
  app_name: string;
  environment: string;
  server: string;
  database: {
    connected: boolean;
    database_name: string;
    engine: string;
    status: string;
    tables_found: string[];
  };
  tesseract_ocr: {
    status: string;
    engine: string;
    message: string;
  };
  cnn_model: CNNInferenceResult;
}
