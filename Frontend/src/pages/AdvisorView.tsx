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
import { ChevronDown } from 'lucide-react';

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
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">RevIQ Strategic Advisor</h1>
          <p className="text-sm text-muted-foreground mt-1">AI-powered renewal intelligence</p>
        </div>

        {/* Actions Group */}
        <div className="flex items-center gap-4">
          {/* Generate Button */}
          <div className="relative">
            <GenerateButton
              onClick={handleGenerateInsight}
              isLoading={isLoading}
              disabled={!selectedAccount}
              size="sm"
            />
          </div>

          {/* Account Selector */}
          <div className="relative">
            <motion.button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl glass-card hover:bg-white/5 transition-colors border border-border/50"
            >
              <span className="text-sm text-muted-foreground">Select Account:</span>
              <span className="font-mono text-foreground">
                {selectedAccount?.account_id || 'Choose...'}
              </span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </motion.button>

            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-full mt-2 w-64 py-2 rounded-xl glass-card border border-border/50 shadow-xl z-50 bg-card"
              >
                {accounts.map((account) => (
                  <button
                    key={account.account_id}
                    onClick={() => handleSelectAccount(account)}
                    className={`
                      w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors
                      ${selectedAccount?.account_id === account.account_id ? 'bg-primary/10' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-foreground">{account.account_id}</span>
                      {account.churn_risk_label === 1 ? (
                        <span className="badge-risk text-[10px]">Risk</span>
                      ) : (
                        <span className="badge-safe text-[10px]">Safe</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      ARR: ${(account.arr / 1000).toFixed(0)}K • {account.days_to_renewal} days
                    </p>
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel - Customer Profile */}
        <div className="lg:col-span-4">
          <CustomerProfile account={selectedAccount} />
        </div>

        {/* Right Panel - AI Insight */}
        <div className="lg:col-span-8">
          <AIInsightPanel insight={insight} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
