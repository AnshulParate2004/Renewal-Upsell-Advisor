import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, AlertTriangle, TrendingUp, Users, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getDashboardStats,
  getHeatmapData,
  type DashboardStats,
  type CustomerAccount
} from '@/lib/api';

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
  const [isLoading, setIsLoading] = useState(false);
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
      const [statsData, heatmap] = await Promise.all([
        getDashboardStats(),
        getHeatmapData(),
      ]);
      setStats(statsData);
      setHeatmapData(heatmap);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
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
    <div className="p-4 max-w-[1600px] mx-auto h-[calc(100vh-64px)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">REAL-TIME PERFORMANCE OVERVIEW</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase text-muted-foreground bg-muted/10 px-2 py-1 rounded border border-border">Q3 2025</span>
        </div>
      </div>

      {/* NBA-Style Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {[
          { label: 'Renewals (90d)', value: stats.renewing_count, icon: <Users size={20} />, color: 'text-black', borderColor: 'border-b-black', iconBg: 'bg-black' },
          { label: 'Risk Exposure', value: formatCurrency(stats.total_arr_at_risk), icon: <AlertTriangle size={20} />, color: 'text-red-600', borderColor: 'border-b-red-600', iconBg: 'bg-red-600' },
          { label: 'Forecasted Churn', value: '8.2%', icon: <DollarSign size={20} />, color: 'text-orange-600', borderColor: 'border-b-orange-600', iconBg: 'bg-orange-600' },
          { label: 'Upsell Pipeline', value: formatCurrency(stats.upsell_pipeline), icon: <TrendingUp size={20} />, color: 'text-emerald-600', borderColor: 'border-b-emerald-600', iconBg: 'bg-emerald-600' }
        ].map((metric, idx) => (
          <div key={idx} className={`p-4 bg-white border-2 border-black border-b-[6px] ${metric.borderColor.replace('border-b-', 'border-b-')} flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-0.5`}>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">{metric.label}</p>
              <div className={`text-3xl font-mono font-bold mt-1 ${metric.color}`}>{metric.value}</div>
            </div>
            <div className={`p-2 border-2 border-black ${metric.iconBg} text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
              {metric.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Real-Time Alert Bar */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`shrink-0 border-2 border-black p-2 flex items-center justify-center gap-2 text-xs font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${activeAlert.severity === 'critical' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>REAL-TIME: {activeAlert.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Focus: Account Risk Table */}
      <div className="flex-1 min-h-0 border-2 border-black bg-white flex flex-col shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="p-3 border-b-2 border-black flex justify-between items-center bg-indigo-600 shrink-0">
          <h3 className="text-sm font-black uppercase tracking-wider text-white">Account Risk Analysis</h3>
          <button onClick={fetchData} disabled={isLoading} className="p-1 hover:bg-white/10 rounded transition-colors text-white"><RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /></button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-50 border-b-2 border-black shadow-sm">
              <tr className="text-xs uppercase text-black font-bold tracking-wide">
                <th className="text-left pl-4 py-3">Account</th>
                <th className="text-right py-3">ARR</th>
                <th className="text-right py-3">Usage</th>
                <th className="text-right py-3">Drop Rate</th>
                <th className="text-center py-3">Tickets</th>
                <th className="text-center py-3">Failures</th>
                <th className="text-center py-3 pr-4">Risk Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {heatmapData.map(acc => (
                <tr key={acc.account_id} onClick={() => handleSelectAccount(acc)} className="hover:bg-black/5 cursor-pointer transition-colors group">
                  <td className="pl-4 py-3 font-bold text-black group-hover:underline decoration-2">{acc.company_name || acc.account_id}</td>
                  <td className="text-right py-3 font-mono font-medium text-black">{formatCurrency(acc.arr)}</td>
                  <td className="text-right py-3 font-mono text-gray-600">{(acc.license_utilization * 100).toFixed(0)}%</td>
                  <td className="text-right py-3 font-mono text-gray-600">{(acc.login_drop_rate * 100).toFixed(1)}%</td>
                  <td className="text-center py-3 font-mono text-gray-600">{acc.support_tickets}</td>
                  <td className="text-center py-3 font-mono text-gray-600">{acc.payment_failures}</td>
                  <td className="text-center py-3 pr-4">
                    <span className={`inline-flex px-3 py-1 text-[10px] uppercase font-black tracking-wide border-2 border-black ${acc.churn_risk_label === 1
                      ? 'bg-red-600 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-white text-green-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]'
                      }`}>
                      {acc.churn_risk_label === 1 ? 'HIGH RISK' : 'HEALTHY'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
