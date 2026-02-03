import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, AlertTriangle, TrendingUp, Users, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RiskHeatmap } from '@/components/dashboard/RiskHeatmap';
import { HistoryChart } from '@/components/dashboard/HistoryChart';
import {
  getDashboardStats,
  getHeatmapData,
  getDashboardHistory,
  type DashboardStats,
  type CustomerAccount,
  type HistoryData
} from '@/lib/api';
import { AnimatePresence } from 'framer-motion';

interface Alert {
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    renewing_count: 0,
    total_arr_at_risk: 0,
    upsell_pipeline: 0
  });
  const [heatmapData, setHeatmapData] = useState<CustomerAccount[]>([]);
  const [historyData, setHistoryData] = useState<HistoryData[]>([]);
  const [historyRange, setHistoryRange] = useState('12m');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [activeAlert, setActiveAlert] = useState<Alert | null>(null);

  // WebSocket Logic
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/alerts');
    ws.onopen = () => console.log('Connected to Alert System');
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'alert') {
          setActiveAlert({
            message: data.message,
            severity: data.severity,
            timestamp: data.timestamp
          });
          setTimeout(() => setActiveAlert(null), 8000);
        }
      } catch (e) {
        console.error('Error parsing alert:', e);
      }
    };
    return () => ws.close();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsData, heatmap, history] = await Promise.all([
        getDashboardStats(),
        getHeatmapData(),
        getDashboardHistory(historyRange),
      ]);
      setStats(statsData);
      setHeatmapData(heatmap);
      setHistoryData(history);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [historyRange]); // Refetch when range changes

  const handleRangeChange = (range: string) => {
    setHistoryRange(range);
  };

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
    <div className="p-4 max-w-[1600px] mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">REAL-TIME PERFORMANCE OVERVIEW</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase text-muted-foreground bg-muted/10 px-2 py-1 rounded border border-border">Q3 2025</span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 border-r border-border flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Renewals (90d)</p>
            <div className="text-2xl font-mono font-bold mt-1">{stats.renewing_count}</div>
          </div>
          <Users className="text-primary w-5 h-5 opacity-50" />
        </div>
        <div className="p-4 border-r border-border flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Risk Exposure</p>
            <div className="text-2xl font-mono font-bold mt-1 text-destructive">{formatCurrency(stats.total_arr_at_risk)}</div>
          </div>
          <AlertTriangle className="text-destructive w-5 h-5 opacity-50" />
        </div>
        <div className="p-4 border-r border-border flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Forecasted Churn</p>
            <div className="text-2xl font-mono font-bold mt-1 text-orange-500">8.2%</div>
          </div>
          <DollarSign className="text-orange-500 w-5 h-5 opacity-50" />
        </div>
        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Upsell Pipeline</p>
            <div className="text-2xl font-mono font-bold mt-1 text-emerald-500">{formatCurrency(stats.upsell_pipeline)}</div>
          </div>
          <TrendingUp className="text-emerald-500 w-5 h-5 opacity-50" />
        </div>
      </div>

      {/* Real-Time Alert Bar - Compact */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`border-x border-b border-border p-2 flex items-center justify-center gap-2 text-xs font-medium ${activeAlert.severity === 'critical' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>REAL-TIME: {activeAlert.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-12 gap-0 border-x border-b border-border bg-background h-[500px]">
        {/* Main History Chart (Span 8) */}
        <div className="col-span-12 lg:col-span-8 border-r border-border p-0 flex flex-col relative overflow-hidden h-full">
          <HistoryChart
            data={historyData}
            selectedRange={historyRange}
            onRangeChange={handleRangeChange}
          />
        </div>

        {/* Risk Heatmap / Accounts List (Span 4) */}
        <div className="col-span-12 lg:col-span-4 bg-card flex flex-col h-full">
          <div className="p-3 border-b border-border flex justify-between items-center bg-muted/30">
            <h3 className="text-xs font-bold uppercase tracking-wider">At-Risk Accounts</h3>
            <button onClick={fetchData} disabled={isLoading} className="p-1 hover:bg-muted rounded"><RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} /></button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full dense-table">
              <thead className="sticky top-0 z-10">
                <tr>
                  <th className="text-left pl-3">Account</th>
                  <th className="text-right">ARR</th>
                  <th className="text-center">Health</th>
                </tr>
              </thead>
              <tbody>
                {heatmapData.slice(0, 15).map(acc => (
                  <tr key={acc.account_id} onClick={() => handleSelectAccount(acc)} className="hover:bg-accent/50 cursor-pointer">
                    <td className="pl-3 font-medium truncate max-w-[120px]">{acc.company_name || acc.account_id}</td>
                    <td className="text-right font-mono text-muted-foreground">{formatCurrency(acc.arr)}</td>
                    <td className="text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${acc.churn_risk_label === 1 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {acc.churn_risk_label === 1 ? 'RISK' : 'SAFE'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>


    </div>
  );
}
