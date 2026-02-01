import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, AlertTriangle, TrendingUp, Users, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RiskHeatmap } from '@/components/dashboard/RiskHeatmap';
import { 
  getDashboardStats, 
  getHeatmapData, 
  mockDashboardStats, 
  mockHeatmapData,
  type DashboardStats,
  type CustomerAccount 
} from '@/lib/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>(mockDashboardStats);
  const [heatmapData, setHeatmapData] = useState<CustomerAccount[]>(mockHeatmapData);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsData, heatmap] = await Promise.all([
        getDashboardStats(),
        getHeatmapData(),
      ]);
      setStats(statsData);
      setHeatmapData(heatmap);
      setLastUpdated(new Date());
    } catch (error) {
      console.log('Using mock data - backend not available');
      // Keep using mock data
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectAccount = (account: CustomerAccount) => {
    navigate('/advisor', { state: { selectedAccount: account } });
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${(value / 1000).toFixed(0)}K`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Executive Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Renewals within 90 days • Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <motion.button
          onClick={fetchData}
          disabled={isLoading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">Refresh</span>
        </motion.button>
      </motion.div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Renewals in Window"
          value={stats.renewing_count}
          subtitle="Next 90 days"
          icon={Users}
          delay={0}
        />
        <MetricCard
          title="Total ARR at Risk"
          value={formatCurrency(stats.total_arr_at_risk)}
          subtitle="High churn probability"
          icon={AlertTriangle}
          variant="danger"
          trend={{ value: 12, isPositive: false }}
          delay={0.1}
        />
        <MetricCard
          title="Forecasted Churn"
          value="8.2%"
          subtitle="Based on risk signals"
          icon={DollarSign}
          variant="danger"
          delay={0.2}
        />
        <MetricCard
          title="Upsell Pipeline"
          value={formatCurrency(stats.upsell_pipeline)}
          subtitle="Expansion opportunity"
          icon={TrendingUp}
          variant="success"
          trend={{ value: 24, isPositive: true }}
          delay={0.3}
        />
      </div>

      {/* Risk Heatmap */}
      <RiskHeatmap data={heatmapData} onSelectAccount={handleSelectAccount} />
    </div>
  );
}
