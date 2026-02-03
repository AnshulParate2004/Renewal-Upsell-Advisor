import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { CustomerProfile } from '@/components/advisor/CustomerProfile';
import { AIInsightPanel } from '@/components/advisor/AIInsightPanel';
import { GenerateButton } from '@/components/advisor/GenerateButton';
import {
  getAdvisorInsight,
  getHeatmapData,
  type CustomerAccount,
  type AdvisorInsight
} from '@/lib/api';
import { ChevronDown, Search } from 'lucide-react';

export default function AdvisorView() {
  const location = useLocation();
  const [selectedAccount, setSelectedAccount] = useState<CustomerAccount | null>(
    location.state?.selectedAccount || null
  );
  const [insight, setInsight] = useState<AdvisorInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [accounts, setAccounts] = useState<CustomerAccount[]>([]);

  useEffect(() => {
    // Fetch accounts for the dropdown
    getHeatmapData()
      .then(data => setAccounts(data))
      .catch(err => console.error("Failed to load accounts:", err));
  }, []);

  const handleGenerateInsight = async () => {
    if (!selectedAccount) return;

    setIsLoading(true);
    setInsight(null);

    try {
      const data = await getAdvisorInsight(selectedAccount.account_id);
      setInsight(data);
    } catch (error) {
      console.error('Error generating insight:', error);
      // In a real app, show a toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAccount = (account: CustomerAccount) => {
    setSelectedAccount(account);
    setInsight(null);
    setIsDropdownOpen(false);
  };

  return (
    <div className="px-4 pb-4 pt-2 max-w-[1600px] mx-auto h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4 sticky top-0 z-20 bg-background/80 backdrop-blur pb-2 border-b border-border/40"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">RevIQ Strategic Advisor</h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">AI-POWERED RENEWAL INTELLIGENCE</p>
        </div>

        {/* Actions Group */}
        <div className="flex items-center gap-3">
          {/* Manual Search */}
          <div className="flex items-center gap-2 mr-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black" />
              <input
                type="text"
                placeholder="ENTER ACCOUNT ID"
                className="pl-9 pr-3 py-2 h-10 w-48 text-xs font-mono font-bold border-2 border-black bg-white focus:outline-none focus:ring-0 placeholder:text-gray-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const target = accounts.find(a => a.account_id.toLowerCase() === e.currentTarget.value.toLowerCase());
                    if (target) {
                      handleSelectAccount(target);
                      e.currentTarget.value = ''; // Clear after found
                    } else {
                      console.log('Account not found');
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="h-8 w-[2px] bg-black/10 mx-1" />

          {/* Generate Button */}
          <div className="relative">
            <GenerateButton
              onClick={handleGenerateInsight}
              isLoading={isLoading}
              disabled={!selectedAccount}
              size="sm"
            />
          </div>

          <div className="h-8 w-[2px] bg-black/10 mx-1" />

          {/* Account Selector */}
          <div className="relative">
            <motion.button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 px-4 py-2 h-10 border-2 border-black bg-indigo-600 hover:bg-indigo-500 transition-colors min-w-[260px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px]"
            >
              <span className="text-xs font-black text-white uppercase tracking-wider">Target:</span>
              <span className="font-mono text-sm font-bold text-white flex-1 text-left truncate">
                {selectedAccount?.account_id || 'SELECT ACCOUNT...'}
              </span>
              <ChevronDown className={`w-4 h-4 text-white transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </motion.button>

            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-full mt-2 w-80 max-h-[400px] overflow-y-auto border-2 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-50 py-0"
              >
                {accounts.map((account) => (
                  <button
                    key={account.account_id}
                    onClick={() => handleSelectAccount(account)}
                    className={`
                      w-full px-4 py-3 text-left hover:bg-indigo-600 hover:text-white transition-colors border-b-2 border-black/5 last:border-0 group
                      ${selectedAccount?.account_id === account.account_id ? 'bg-indigo-600 text-white' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-sm font-bold">{account.account_id}</span>
                      {account.churn_risk_label === 1 ? (
                        <span className="px-1.5 py-0.5 text-[10px] font-black bg-red-600 text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] group-hover:shadow-none group-hover:border-white">RISK</span>
                      ) : (
                        <span className="px-1.5 py-0.5 text-[10px] font-black bg-white text-green-700 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] group-hover:shadow-none group-hover:border-white">SAFE</span>
                      )}
                    </div>
                    <div className={`flex items-center justify-between text-xs font-bold ${selectedAccount?.account_id === account.account_id ? 'text-white' : 'text-gray-500 group-hover:text-white'}`}>
                      <span>${(account.arr / 1000).toFixed(0)}K ARR</span>
                      <span className={account.days_to_renewal <= 30 ? 'text-red-500 group-hover:text-white' : ''}>
                        {account.days_to_renewal} days
                      </span>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-0 border-2 border-black bg-white flex-1 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        {/* Left Panel - Customer Profile */}
        <div className="col-span-12 lg:col-span-4 border-r-2 border-black h-full overflow-y-auto bg-indigo-50/30">
          <CustomerProfile account={selectedAccount} />
        </div>

        {/* Right Panel - AI Insight */}
        <div className="col-span-12 lg:col-span-8 h-full overflow-y-auto bg-white">
          <AIInsightPanel insight={insight} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
