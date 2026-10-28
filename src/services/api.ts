/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  AnalysisRecord,
  DashboardStats,
  TrainingDatasetInfo,
  TrainingJob,
  SystemHealth
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
      let errorDetails = null;
      try {
        const errorJson = await response.json();
        errorMsg = errorJson.detail || errorJson.error || errorMsg;
        errorDetails = errorJson;
      } catch (e) {
        // Not JSON
      }
      throw new ApiError(response.status, errorMsg, errorDetails);
    }

    return (await response.json()) as T;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(0, `Network failure reaching ${url}: ${err.message || 'Unknown network error'}`);
  }
}

export const api = {
  // System Health
  async getHealth(): Promise<SystemHealth> {
    return request<SystemHealth>('/health');
  },

  async getDatabaseHealth(): Promise<any> {
    return request<any>('/health/database');
  },

  // Dashboard Stats
  async getStats(): Promise<DashboardStats> {
    return request<DashboardStats>('/stats');
  },

  // Image Analysis
  async analyzeImage(
    file: File | Blob,
    filename: string,
    extraData?: { ocrText?: string; dimensions?: string; imageBase64?: string }
  ): Promise<AnalysisRecord> {
    const formData = new FormData();
    formData.append('file', file, filename);

    if (extraData?.ocrText) {
      formData.append('ocrText', extraData.ocrText);
    }
    if (extraData?.dimensions) {
      formData.append('dimensions', extraData.dimensions);
    }
    if (extraData?.imageBase64) {
      formData.append('imageBase64', extraData.imageBase64);
    }

    return request<AnalysisRecord>('/analyze', {
      method: 'POST',
      body: formData,
    });
  },

  // Direct Base64 analysis (for captured camera frames)
  async analyzeBase64(
    imageBase64: string,
    filename: string,
    ocrText?: string,
    dimensions?: string
  ): Promise<AnalysisRecord> {
    return request<AnalysisRecord>('/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64,
        filename,
        ocrText,
        dimensions,
      }),
    });
  },

  // History
  async getHistory(page = 1, pageSize = 10, assessment?: string): Promise<{
    items: AnalysisRecord[];
    total_count: number;
    page: number;
    page_size: number;
    total_pages: number;
  }> {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
    });
    if (assessment && assessment !== 'ALL') {
      params.append('assessment', assessment);
    }
    return request(`/history?${params.toString()}`);
  },

  async getAnalysisDetail(analysisId: string): Promise<AnalysisRecord> {
    return request<AnalysisRecord>(`/history/${analysisId}`);
  },

  async deleteAnalysis(analysisId: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/history/${analysisId}`, {
      method: 'DELETE',
    });
  },

  // Model & Training
  async getModelStatus(): Promise<any> {
    return request<any>('/model/status');
  },

  async getTrainingDataset(): Promise<TrainingDatasetInfo> {
    return request<TrainingDatasetInfo>('/training/dataset');
  },

  async startTraining(params: {
    epochs: number;
    batch_size: number;
    learning_rate: number;
    train_split: number;
    val_split: number;
    test_split: number;
  }): Promise<TrainingJob> {
    return request<TrainingJob>('/training/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  },

  async getTrainingJobStatus(jobId: string): Promise<TrainingJob> {
    return request<TrainingJob>(`/training/${jobId}`);
  },

  async listTrainingJobs(): Promise<{ jobs: TrainingJob[]; total: number }> {
    return request<{ jobs: TrainingJob[]; total: number }>('/training/jobs');
  },
};
