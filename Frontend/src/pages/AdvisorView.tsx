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
    <div className="p-4 max-w-[1600px] mx-auto h-screen flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">RevIQ Strategic Advisor</h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">AI-POWERED RENEWAL INTELLIGENCE</p>
        </div>

        {/* Actions Group */}
        <div className="flex items-center gap-3">
          {/* Generate Button */}
          <div className="relative">
            <GenerateButton
              onClick={handleGenerateInsight}
              isLoading={isLoading}
              disabled={!selectedAccount}
              size="sm"
            />
          </div>

          <div className="h-8 w-[1px] bg-border mx-1" />

          {/* Account Selector */}
          <div className="relative">
            <motion.button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 px-3 py-1.5 h-9 rounded border border-border bg-card hover:bg-muted transition-colors min-w-[240px]"
            >
              <span className="text-xs font-bold text-muted-foreground uppercase">Target:</span>
              <span className="font-mono text-sm text-foreground flex-1 text-left truncate">
                {selectedAccount?.account_id || 'SELECT ACCOUNT...'}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </motion.button>

            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-full mt-1 w-80 max-h-[400px] overflow-y-auto rounded border border-border bg-card shadow-lg z-50 py-1"
              >
                {accounts.map((account) => (
                  <button
                    key={account.account_id}
                    onClick={() => handleSelectAccount(account)}
                    className={`
                      w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0
                      ${selectedAccount?.account_id === account.account_id ? 'bg-primary/5' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-sm font-medium text-foreground">{account.account_id}</span>
                      {account.churn_risk_label === 1 ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">RISK</span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">SAFE</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>${(account.arr / 1000).toFixed(0)}K ARR</span>
                      <span className={account.days_to_renewal <= 30 ? 'text-destructive font-bold' : ''}>
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
      <div className="grid grid-cols-12 gap-0 border border-border bg-card rounded overflow-hidden flex-1 shadow-sm">
        {/* Left Panel - Customer Profile */}
        <div className="col-span-12 lg:col-span-4 border-r border-border h-full overflow-y-auto bg-muted/5">
          <CustomerProfile account={selectedAccount} />
        </div>

        {/* Right Panel - AI Insight */}
        <div className="col-span-12 lg:col-span-8 h-full overflow-y-auto bg-background">
          <AIInsightPanel insight={insight} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
