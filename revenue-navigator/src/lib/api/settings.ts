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
    churnCallFrequencyDays?: number;
    objectionFollowUpHours?: number;
    stopStandardCampaignsOnChurn?: boolean;
    stopWorkflowsOnCritical?: boolean;
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
  lifecycle_buckets?: LifecycleBucketsConfig;
}

export interface LifecycleBucketsConfig {
  protect_min_risk_score: number;
  protect_include_at_risk_status: boolean;
  activate_max_days_since_start: number;
  activate_max_utilization_percent: number;
  renew_window_min_days: number;
  renew_window_max_days: number;
  expand_min_health_score: number;
  expand_min_utilization_percent: number;
  expand_max_risk_score: number;
  adopt_max_utilization_percent: number;
}

export const DEFAULT_LIFECYCLE_BUCKETS: LifecycleBucketsConfig = {
  protect_min_risk_score: 70,
  protect_include_at_risk_status: true,
  activate_max_days_since_start: 90,
  activate_max_utilization_percent: 45,
  renew_window_min_days: 0,
  renew_window_max_days: 120,
  expand_min_health_score: 65,
  expand_min_utilization_percent: 72,
  expand_max_risk_score: 45,
  adopt_max_utilization_percent: 58,
};

export interface SetupConfig {
  resend_api_key?: string;
  from_email?: string;
  from_name: string;
  cube_api_url?: string;
  cube_api_key?: string;
  twilio_account_sid?: string;
  twilio_auth_token?: string;
  twilio_phone_number?: string;
  twilio_whatsapp_number?: string;
  automation_paused: boolean;
  pipeline_type?: string;
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
