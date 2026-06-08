import { fetchApi } from './client';

export interface PortfolioKpis {
  total_accounts: number;
  churn_risk_count: number;
  avg_health_score: number;
  avg_relationship_score: number;
  avg_sentiment_score: number;
  total_revenue: number;
  upsell_pipeline: number;
  avg_utilization_percent: number;
  accounts_on_track: number;
  upsell_account_count: number;
  renewed_count: number;
}

export interface LifecycleStageMetric {
  stage: string;
  label: string;
  count: number;
  revenue: number;
}

export interface RenewalQuarterMetric {
  quarter: string;
  label: string;
  count: number;
  revenue: number;
  days_range: string;
}

export interface RiskDistributionItem {
  name: string;
  value: number;
}

export interface UpsellStageMetric {
  stage: string;
  count: number;
  value: number;
}

export interface PortfolioConsumption {
  avg_deployment_pct: number;
  products_at_risk: number;
  unused_entitlements: number;
  accounts_needing_action: number;
}

export interface ScoreBucket {
  bucket: string;
  count: number;
}

export interface ScoreDistribution {
  metric: string;
  buckets: ScoreBucket[];
}

export interface TopAtRiskAccount {
  account_id: string;
  account_name: string;
  stage: string;
  stage_label: string;
  risk_score: number;
  renewal_days: number | null;
  revenue: number;
}

export interface AnalyticsGoals {
  upsell_pipeline_target: number;
  renewal_target_percent: number;
  high_risk_threshold_percent: number;
  upsell_pipeline_actual: number;
  renewal_rate_percent: number;
  high_risk_count: number;
}

export interface PortfolioAnalyticsResponse {
  kpis: PortfolioKpis;
  lifecycle_stages: LifecycleStageMetric[];
  renewal_quarters: RenewalQuarterMetric[];
  risk_distribution: RiskDistributionItem[];
  upsell_by_stage: UpsellStageMetric[];
  portfolio_consumption: PortfolioConsumption;
  score_distributions: ScoreDistribution[];
  top_at_risk_accounts: TopAtRiskAccount[];
  goals: AnalyticsGoals;
}

export interface TrendDataPoint {
  month: string;
  total_revenue: number;
  churn_risk_count: number;
  renewed_count: number;
  at_risk_count: number;
  avg_health_score: number;
}

export interface AnalyticsTrendsResponse {
  months: number;
  series: TrendDataPoint[];
}

export interface DashboardStatsResponse {
  total_accounts: number;
  churn_risk_count: number;
  avg_health_score: number;
  avg_relationship_score: number;
  avg_sentiment_score: number;
  total_arr: number;
  upsell_pipeline: number;
}

function billingQuery(billingInterval?: 'monthly' | 'annual') {
  return billingInterval ? `?billing_interval=${billingInterval}` : '';
}

export const analyticsApi = {
  getDashboardStats: async (billingInterval?: 'monthly' | 'annual'): Promise<DashboardStatsResponse> => {
    return fetchApi(`/analytics/dashboard${billingQuery(billingInterval)}`);
  },

  getPortfolioAnalytics: async (
    billingInterval?: 'monthly' | 'annual'
  ): Promise<PortfolioAnalyticsResponse> => {
    return fetchApi(`/analytics/portfolio${billingQuery(billingInterval)}`);
  },

  getAnalyticsTrends: async (
    billingInterval?: 'monthly' | 'annual',
    months = 12
  ): Promise<AnalyticsTrendsResponse> => {
    const params = new URLSearchParams();
    if (billingInterval) params.set('billing_interval', billingInterval);
    params.set('months', String(months));
    return fetchApi(`/analytics/trends?${params.toString()}`);
  },
};
