import { fetchApi } from "./client";

export interface PredictionRequest {
  account_id: string;
  features: Record<string, unknown>;
}

export interface BatchPredictionRequest {
  account_ids: string[];
  model_types?: string[];
}

export interface PredictionResult {
  prediction_value?: number;
  confidence?: number;
  model_type?: string;
}

export interface PredictAllResponse {
  account_id: string;
  predictions: {
    health_score?: PredictionResult;
    churn?: PredictionResult;
    relationship_score?: PredictionResult;
    renewal?: PredictionResult;
    sentiment?: PredictionResult;
    upsell?: PredictionResult;
  };
  timestamp?: string;
}

export const predictionsApi = {
  predict: async (data: PredictionRequest) => {
    return fetchApi("/predictions/predict", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  predictAll: async (data: PredictionRequest): Promise<PredictAllResponse> => {
    return fetchApi("/predictions/predict/all", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  predictBatch: async (data: BatchPredictionRequest) => {
    return fetchApi("/predictions/predict/batch", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getHealth: async () => {
    return fetchApi("/predictions/health");
  },
};
