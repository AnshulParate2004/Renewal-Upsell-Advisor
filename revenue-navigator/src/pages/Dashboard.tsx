import { useState, useMemo } from "react";

import { AlertTriangle, Loader2, Shield, Sparkles } from "lucide-react";

import { motion } from "framer-motion";

import { useAccounts } from "@/hooks/useAccounts";

import { useDashboardStats } from "@/hooks/useAnalytics";

import { useOpportunities } from "@/hooks/useOpportunities";

import { useRevenue } from "@/contexts/RevenueContext";

import { useLifecycleDashboard } from "@/hooks/useLifecycleDashboard";
import { useAgentRecommendation } from "@/hooks/useAgentRecommendation";

import { LIFECYCLE_STAGES } from "@/lib/lifecycleEngine";

import { getVendorDisplayName, getVendorId } from "@/lib/vendorProducts";

import { LifecycleStageCard } from "@/components/lifecycle/LifecycleStageCard";

import { NBADigestPanel } from "@/components/lifecycle/NBADigestPanel";

import { LifecycleAgentPanel } from "@/components/lifecycle/LifecycleAgentPanel";

import { LifecycleStageFilter, type StageFilter } from "@/components/lifecycle/LifecycleStageFilter";

import { DashboardMetricCards } from "@/components/dashboard/DashboardMetricCards";

import type { LifecycleStageId } from "@/types/lifecycle";



export default function Dashboard() {

  const { revenueType } = useRevenue();

  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats();

  const { data: accounts = [], isLoading: accountsLoading, error: accountsError } = useAccounts();

  const { data: opportunities = [] } = useOpportunities();

  const {

    data: lifecycle,

    isLoading: lifecycleLoading,

    error: lifecycleError,

  } = useLifecycleDashboard(accounts);

  const vendorName = getVendorDisplayName(getVendorId());

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const [stageFilter, setStageFilter] = useState<StageFilter>("all");

  const filteredAccounts = useMemo(() => {
    if (stageFilter === "all" || !lifecycle?.accountAlerts?.length) {
      return accounts;
    }
    const ids = new Set(
      lifecycle.accountAlerts
        .filter((alert) => alert.stage === stageFilter)
        .map((alert) => alert.account.id)
    );
    return accounts.filter((account) => ids.has(account.id));
  }, [accounts, lifecycle?.accountAlerts, stageFilter]);

  const fatalError = accountsError || statsError;
  const lifecycleSectionLoading = lifecycleLoading && !lifecycle;



  const totalArr = filteredAccounts.reduce((sum, a) => sum + (a.arr ?? 0), 0);

  const totalMrr = filteredAccounts.reduce((sum, a) => sum + (a.mrr ?? 0), 0);

  const displayRevenue = revenueType === "MRR" ? totalMrr : totalArr;

  const revenueLabel = revenueType === "ARR" ? "Total Annual Recurring Revenue" : "Total Monthly Recurring Revenue";



  const stageCounts = useMemo(() => {

    const raw = lifecycle?.stageCounts ?? { all: accounts.length };

    return {

      all: raw.all ?? accounts.length,

      protect: raw.protect ?? 0,

      renew: raw.renew ?? 0,

      adopt: raw.adopt ?? 0,

      expand: raw.expand ?? 0,

      activate: raw.activate ?? 0,

    };

  }, [lifecycle?.stageCounts, accounts.length]);



  const filteredNbaItems = useMemo(() => {
    if (!lifecycle) return [];
    if (stageFilter === "all") return lifecycle.nbaItems;
    return lifecycle.nbaItems.filter((item) => item.stage === stageFilter);
  }, [lifecycle, stageFilter]);

  const handleStageFilterChange = (filter: StageFilter) => {
    setStageFilter(filter);
    if (filter === "all") {
      setSelectedAccountId(null);
      return;
    }
    const first = lifecycle?.accountAlerts.find((a) => a.stage === filter);
    setSelectedAccountId(first?.account.id ?? null);
  };

  const selectedAlert = useMemo(() => {
    if (!lifecycle) return null;

    if (stageFilter !== "all") {
      if (selectedAccountId) {
        const match = lifecycle.accountAlerts.find((a) => a.account.id === selectedAccountId);
        if (match?.stage === stageFilter) return match;
      }
      return lifecycle.accountAlerts.find((a) => a.stage === stageFilter) ?? null;
    }

    if (selectedAccountId) {
      const match = lifecycle.accountAlerts.find((a) => a.account.id === selectedAccountId);
      if (match) return match;
    }

    const topNba = filteredNbaItems[0];
    if (topNba) {
      const fromNba = lifecycle.accountAlerts.find((a) => a.account.id === topNba.accountId);
      if (fromNba) return fromNba;
    }

    const protectRep = lifecycle.stageAlerts.find((a) => a.stage === "protect");
    if (protectRep) return protectRep;

    return lifecycle.stageAlerts[0] ?? null;
  }, [selectedAccountId, lifecycle, stageFilter, filteredNbaItems]);



  const { data: agentRecommendation } = useAgentRecommendation(selectedAlert?.account.id ?? null);



  const stageAlertMap = useMemo(() => {

    const map = new Map<LifecycleStageId, NonNullable<typeof lifecycle>["stageAlerts"][0]>();

    lifecycle?.stageAlerts.forEach((a) => map.set(a.stage, a));

    return map;

  }, [lifecycle?.stageAlerts]);



  return (

    <div className="h-[calc(100vh-56px)] flex flex-col bg-background">

      <motion.div

        initial={{ opacity: 0, y: -10 }}

        animate={{ opacity: 1, y: 0 }}

        className="bg-card border-b-2 border-black px-6 py-4 shrink-0"

      >

        <div className="max-w-[1600px] mx-auto space-y-4">

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

            <div className="min-w-0 flex-1">

              <div className="flex items-center gap-2 mb-1">

                <Shield className="w-4 h-4 text-primary shrink-0" />

                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">

                  Agentic Customer Lifecycle Management

                </span>

              </div>

              <h1 className="text-xl font-bold">Unified Renewal Command Centre</h1>

              <p className="text-xs text-muted-foreground mt-1 max-w-2xl">

                AI agents scale customer lifecycle management for {vendorName} — accelerate deployment,

                drive expansion, boost renewals, and minimize churn with consumption-based alerts.

              </p>

            </div>

            <div className="flex items-center gap-2 shrink-0 sm:pt-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 border-2 border-emerald-500 rounded-lg whitespace-nowrap">
                <Sparkles className="w-3 h-3" /> websocket live
              </div>
            </div>

          </div>



          {!fatalError && (
            <div className="pt-3 border-t border-black/10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                Filter by lifecycle stage
              </p>
              <LifecycleStageFilter
                value={stageFilter}
                onChange={handleStageFilterChange}
                counts={stageCounts}
              />
            </div>
          )}

        </div>

      </motion.div>



      <div className="flex-1 overflow-auto">

        <div className="max-w-[1600px] mx-auto w-full p-6 space-y-5">

          {fatalError ? (
            <div className="flex items-center justify-center py-24 text-destructive">
              <AlertTriangle className="w-5 h-5 mr-3" />
              <span className="text-sm">Failed to load data. Ensure the backend is running.</span>
            </div>
          ) : (
            <>
              {accountsLoading && accounts.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="ml-3 text-sm text-muted-foreground">Loading accounts…</span>
                </div>
              ) : (
                <DashboardMetricCards
                  accounts={filteredAccounts}
                  opportunities={opportunities}
                  stats={stats}
                  revenueLabel={revenueLabel}
                  displayRevenue={displayRevenue}
                  stageFilter={stageFilter}
                />
              )}

              {lifecycleSectionLoading ? (
                <div className="flex items-center justify-center py-16 border-2 border-dashed border-black/20 rounded-xl">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="ml-3 text-sm text-muted-foreground">Loading lifecycle intelligence…</span>
                </div>
              ) : lifecycleError && !lifecycle ? (
                <div className="flex items-center justify-center py-12 text-destructive text-sm">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Lifecycle data unavailable — KPI cards above are still current.
                </div>
              ) : lifecycle ? (
                <>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                      Customer Lifecycle Status — Prioritized Alerts
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      {LIFECYCLE_STAGES.map((stage) => {
                        const alert = stageAlertMap.get(stage.id);
                        const dimmed = stageFilter !== "all" && stageFilter !== stage.id;
                        return (
                          <div key={stage.id} className={dimmed ? "opacity-40 pointer-events-none" : ""}>
                            <LifecycleStageCard
                              stageId={stage.id}
                              alert={alert}
                              accountCount={stageCounts[stage.id]}
                              isSelected={stageFilter !== "all" && stageFilter === stage.id}
                              onSelect={() => {
                                setStageFilter(stage.id);
                                if (alert && stageCounts[stage.id] > 0) {
                                  setSelectedAccountId(alert.account.id);
                                } else {
                                  setSelectedAccountId(null);
                                }
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <NBADigestPanel
                      items={filteredNbaItems}
                      selectedAccountId={selectedAlert?.account.id}
                      onSelectAccount={(accountId) => {
                        setSelectedAccountId(accountId);
                      }}
                    />
                    <LifecycleAgentPanel
                      alert={selectedAlert}
                      recommendation={agentRecommendation}
                      emptyMessage={
                        stageFilter !== "all" && stageCounts[stageFilter] === 0
                          ? `No accounts in ${LIFECYCLE_STAGES.find((s) => s.id === stageFilter)?.label ?? stageFilter} — select another stage or ALL.`
                          : undefined
                      }
                    />
                  </div>
                </>
              ) : null}
            </>
          )}

        </div>

      </div>

    </div>

  );

}


