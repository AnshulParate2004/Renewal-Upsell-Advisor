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
  pipeline_flow?: {
    q1: string;
    q2: string;
    q3: string;
    q4: string;
    renewed: string;
  };
}

export interface SetupConfig {
  sendgrid_api_key?: string;
  from_email?: string;
  from_name: string;
  twilio_account_sid?: string;
  twilio_auth_token?: string;
  twilio_phone_number?: string;
  twilio_whatsapp_number?: string;
  automation_paused: boolean;
  created_at?: string;
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

export const setupApi = {
  getSetup: async () => {
    return fetchApi('/settings/setup');
  },
  saveSetup: async (data: SetupConfig) => {
    return fetchApi('/settings/setup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  pauseAutomation: async () => {
    return fetchApi('/settings/setup/pause', {
      method: 'PATCH',
      body: JSON.stringify({}),
    });
  },
};
