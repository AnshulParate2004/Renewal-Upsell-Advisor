/**
 * React Query hooks for Predictions
 */
import { useQuery, useMutation } from '@tanstack/react-query';
import { predictionsApi } from '@/lib/api/predictions';
import type { PredictionRequest, BatchPredictionRequest } from '@/lib/api/predictions';

export const usePredictions = (request: PredictionRequest, enabled = true) => {
  return useQuery({
    queryKey: ['predictions', request.account_id, request.features],
    queryFn: () => predictionsApi.predictAll(request),
    enabled: enabled && !!request.account_id,
    staleTime: 60000, // 1 minute
  });
};

export const usePrediction = (request: PredictionRequest, enabled = true) => {
  return useQuery({
    queryKey: ['prediction', request.account_id, request.features],
    queryFn: () => predictionsApi.predict(request),
    enabled: enabled && !!request.account_id,
    staleTime: 60000,
  });
};

export const useBatchPredictions = () => {
  return useMutation({
    mutationFn: (request: BatchPredictionRequest) => predictionsApi.predictBatch(request),
  });
};

export const useModelHealth = () => {
  return useQuery({
    queryKey: ['model-health'],
    queryFn: () => predictionsApi.getHealth(),
    staleTime: 300000, // 5 minutes
    refetchInterval: 300000,
  });
};
