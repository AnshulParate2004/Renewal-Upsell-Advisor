import { fetchApi } from './client';

export interface AppSettings {
  schedule: {
    callWindowStart: string;
    callWindowEnd: string;
    emailWindowStart: string;
    emailWindowEnd: string;
    followUpDays: number;
    autoEmailScheduleTime: string;
    autoCallScheduleTime: string;
    reminderDaysBeforeRenewal: number;
  };
  metrics: {
    churnRiskThreshold: number;
    renewalTarget: number;
    upsellPipelineTarget: number;
    renewalReminderAtCompletionPercent: number;
    highRiskScoreThresholdPercent: number;
    churnProbabilityThresholdPercent: number;
    minUsagePercentForCall: number;
    healthScoreAtRiskBelowPercent: number;
    callMilestonePercents: number[];
    emailMilestonePercents: number[];
    churnDiscountPercentage?: number;
  };
  notifications?: {
    highRisk?: boolean;
    renewals?: boolean;
    daily?: boolean;
    failedCalls?: boolean;
    churnDiscount?: boolean;
  };
  email?: {
    smtpHost?: string;
    smtpPort?: number;
    smtpUsername?: string;
    smtpPassword?: string;
    fromEmail?: string;
    fromName?: string;
  };
}

export const settingsApi = {
  getConfig: async () => {
    return fetchApi('/settings/config');
  },
  updateConfig: async (data: AppSettings) => {
    return fetchApi('/settings/config', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
