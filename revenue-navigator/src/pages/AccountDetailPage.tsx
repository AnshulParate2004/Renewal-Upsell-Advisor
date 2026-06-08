import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { TrendingUp, AlertTriangle, Building2, Clock, BarChart3, Loader2, Ticket, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency, getDaysUntil, getRenewalInDays } from "@/data/mockData";
import { generateHistoricalData } from "@/data/historicalDataGenerator";
import type { Account } from "@/data/mockData";
import MetricsHistoryChart from "@/components/charts/MetricsHistoryChart";
import SentimentTrendChart from "@/components/charts/SentimentTrendChart";
import ActivityTimeline from "@/components/ActivityTimeline";
import { useAccount, useUpdateAccount } from "@/hooks/useAccounts";
import { usePredictions } from "@/hooks/usePredictions";
import { accountCommentsApi, type AccountComment } from "@/lib/api/accountComments";
import { accountsApi } from "@/lib/api/accounts";
import type { AccountActivity } from "@/data/mockData";
import { AccountActionBoard } from "@/components/AccountActionBoard";
import { AccountUpsellRenewalDetails } from "@/components/AccountUpsellRenewalDetails";
import { AccountDetailHeader } from "@/components/account/AccountDetailHeader";
import { AccountKpiStrip } from "@/components/account/AccountKpiStrip";
import { AccountHealthSidebar } from "@/components/account/AccountHealthSidebar";
import { AccountCommentsPanel } from "@/components/account/AccountCommentsPanel";
import { ContactInfoSection } from "@/components/account/ContactInfoSection";
import { useActionRecommendation } from "@/hooks/useActionRecommendation";
import { useAccountTicketStats } from "@/hooks/useTicketStats";

export default function AccountDetailPage() {
    const { accountId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const focusParam = searchParams.get("focus");
    const actionFocus =
        focusParam === "call" || focusParam === "email" || focusParam === "message"
            ? focusParam
            : undefined;
    const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'analytics'>('overview');
    const [comments, setComments] = useState<AccountComment[]>([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [newCommentBody, setNewCommentBody] = useState('');
    const [addCommentLoading, setAddCommentLoading] = useState(false);
    const [timelineActivities, setTimelineActivities] = useState<AccountActivity[]>([]);
    const [timelineLoading, setTimelineLoading] = useState(false);

    const { data: account, isLoading, error } = useAccount(accountId || '');
    const { data: lifecycleRec, isLoading: lifecycleLoading } = useActionRecommendation(accountId || '');
    const { data: ticketStats, isLoading: ticketStatsLoading } = useAccountTicketStats(accountId || '');
    const updateAccount = useUpdateAccount();

    // Get predictions for this account
    const { data: predictions } = usePredictions(
        {
            account_id: accountId || '',
            features: account ? {
                arr: account.arr,
                health_score: account.healthScore,
                risk_score: account.riskScore,
                relationship_score: account.relationshipScore,
                utilization: account.utilization,
                industry: account.industry || '',
                company_size: account.industry || '', // Fallback
            } : {}
        },
        !!account && !!accountId
    );

    // Merge account with ML predictions (churn is 0â€“1 probability, not risk score)
    const accountWithPredictions = account ? {
        ...account,
        healthScore: predictions?.predictions?.health_score?.prediction_value ?? account.healthScore,
        riskScore: account.riskScore,
        relationshipScore: predictions?.predictions?.relationship_score?.prediction_value ?? account.relationshipScore,
        churnProbability: predictions?.predictions?.churn?.prediction_value ?? account.churnProbability,
        sentimentScore: predictions?.predictions?.sentiment?.prediction_value ?? account.sentimentScore,
    } : null;

    // Fetch comments when accountId is available (must run before any conditional return to satisfy rules of hooks)
    useEffect(() => {
        if (!accountId) return;
        setCommentsLoading(true);
        accountCommentsApi.getByAccountId(accountId).then(setComments).catch(() => setComments([])).finally(() => setCommentsLoading(false));
    }, [accountId]);

    // Fetch timeline from database (seed data + real events)
    useEffect(() => {
        if (!accountId) return;
        setTimelineLoading(true);
        accountsApi.getTimeline(accountId).then(setTimelineActivities).catch(() => setTimelineActivities([])).finally(() => setTimelineLoading(false));
    }, [accountId]);

    // Show loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-foreground/60 font-black uppercase tracking-wider">Loading account data...</p>
                </div>
            </div>
        );
    }

    // Show error state
    if (error || !account || !accountWithPredictions) {
        return (
            <div className="min-h-screen bg-purple-50/30 flex items-center justify-center p-8">
                <div className="paper-card bg-white p-12 text-center max-w-md shadow-2xl shadow-purple-900/10 rounded-3xl">
                    <div className="w-20 h-20 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle size={40} />
                    </div>
                    <h2 className="text-3xl font-bold text-foreground mb-4 tracking-tight">Account Not Found</h2>
                    <p className="text-gray-500 mb-8 font-medium">
                        {error ? `Error: ${error.message}` : 'The account record you are looking for does not exist in the current registry.'}
                    </p>
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full px-6 py-4 bg-primary text-white border border-black rounded-lg text-sm font-black uppercase tracking-wider hover:shadow-md transition-all"
                    >
                        RETURN_TO_BASE
                    </button>
                </div>
            </div>
        );
    }

    // Generate historical data for analytics tab only (metrics + sentiment). Timeline comes from API.
    const history = generateHistoricalData(accountWithPredictions as Account);

    const getSentimentColor = (score: number) => {
        if (score > 0.5) return "text-emerald-600";
        if (score > 0) return "text-blue-600";
        if (score > -0.5) return "text-amber-600";
        return "text-red-600";
    };

    const getSentimentLabel = (score: number) => {
        if (score > 0.5) return "EXCEPTIONAL";
        if (score > 0) return "POSITIVE";
        if (score > -0.5) return "NEUTRAL";
        return "CRITICAL";
    };

    const getSentimentEmoji = (score: number) => {
        if (score > 0.5) return "ðŸ˜Š";
        if (score > 0) return "ðŸ™‚";
        if (score > -0.5) return "ðŸ˜";
        return "ðŸ˜Ÿ";
    };

    const handleAddComment = async () => {
        if (!accountId || !newCommentBody.trim()) return;
        setAddCommentLoading(true);
        try {
            const created = await accountCommentsApi.create(accountId, newCommentBody.trim());
            setComments((prev) => [created, ...prev]);
            setNewCommentBody('');
        } finally {
            setAddCommentLoading(false);
        }
    };

    const tabs = [
        { id: 'overview', label: 'OVERVIEW', icon: <Building2 size={16} /> },
        { id: 'timeline', label: 'TIMELINE', icon: <Clock size={16} /> },
        { id: 'analytics', label: 'ANALYTICS', icon: <BarChart3 size={16} /> }
    ] as const;

    const renewalDays =
        getRenewalInDays(
            accountWithPredictions.renewalDate,
            accountWithPredictions.contractEnd,
            accountWithPredictions.status
        ) ?? getDaysUntil(accountWithPredictions.renewalDate);
    const licencePct = (() => {
        const u = accountWithPredictions.licensesUsed ?? 0;
        const t = accountWithPredictions.licensesTotal ?? 0;
        return t ? Math.round((u / t) * 100) : 0;
    })();
    const revenueVal = (() => {
        const v =
            accountWithPredictions.mrr != null
                ? accountWithPredictions.mrr
                : accountWithPredictions.arr != null
                  ? accountWithPredictions.arr / 12
                  : null;
        return v != null ? formatCurrency(v) : "â€”";
    })();
    const renewalStageLabel = (() => {
        const s = (accountWithPredictions.renewalStage || "").toLowerCase();
        if (["q1", "q2", "q3", "q4"].includes(s)) return s.toUpperCase();
        if (s === "renewed" || s === "lost") return s.toUpperCase();
        if (s === "t30") return "Q1";
        if (s === "t60") return "Q2";
        if (s === "t90") return "Q4";
        return s ? s.toUpperCase() : "â€”";
    })();

    const kpiItems = [
        { label: "Revenue", value: revenueVal, icon: <TrendingUp className="w-4 h-4" /> },
        {
            label: "Renewal in",
            value: `${renewalDays} days`,
            icon: <Clock className="w-4 h-4" />,
            alert: renewalDays <= 30,
        },
        { label: "Licence used", value: `${licencePct}%`, icon: <Building2 className="w-4 h-4" /> },
        {
            label: "Lifecycle",
            value: lifecycleRec?.stageLabel ?? (lifecycleLoading ? "â€¦" : "â€”"),
            icon: <BarChart3 className="w-4 h-4" />,
        },
        { label: "Renewal stage", value: renewalStageLabel, icon: <Clock className="w-4 h-4" /> },
        {
            label: "Tickets raised",
            value: ticketStatsLoading ? "â€¦" : String(ticketStats?.raised ?? 0),
            icon: <Ticket className="w-4 h-4 text-orange-600" />,
        },
        {
            label: "Resolved",
            value: ticketStatsLoading ? "â€¦" : String(ticketStats?.resolved ?? 0),
            icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
        },
    ];

    return (
        <div className="min-h-screen bg-muted/20">
            <AccountDetailHeader
                account={accountWithPredictions as Account}
                lifecycleRec={lifecycleRec}
                lifecycleLoading={lifecycleLoading}
            />

            <div className="border-b border-black/10 bg-card">
                <div className="max-w-7xl mx-auto flex px-4 sm:px-6">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-3.5 text-sm font-medium transition-colors flex items-center gap-2 relative ${
                                activeTab === tab.id
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {tab.icon}
                            {tab.label.charAt(0) + tab.label.slice(1).toLowerCase()}
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                {activeTab === "overview" && (
                    <div className="space-y-6">
                        <AccountKpiStrip items={kpiItems} />

                        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
                            <div className="space-y-6 min-w-0">
                                <AccountActionBoard
                                    account={accountWithPredictions as Account}
                                    initialFocus={actionFocus}
                                />
                                <AccountUpsellRenewalDetails account={accountWithPredictions as Account} />
                                <ContactInfoSection
                                    account={accountWithPredictions as Account}
                                    accountId={accountId || ""}
                                />
                            </div>

                            <div className="space-y-6 xl:sticky xl:top-20">
                                <AccountHealthSidebar
                                    account={accountWithPredictions as Account}
                                    ticketStats={ticketStats}
                                    ticketStatsLoading={ticketStatsLoading}
                                    onAutomationChange={(checked) => {
                                        updateAccount.mutate({
                                            id: accountId!,
                                            data: { automation_enabled: checked },
                                        });
                                    }}
                                    getSentimentLabel={getSentimentLabel}
                                    getSentimentColor={getSentimentColor}
                                    getSentimentEmoji={getSentimentEmoji}
                                />
                                <AccountCommentsPanel
                                    comments={comments}
                                    commentsLoading={commentsLoading}
                                    newCommentBody={newCommentBody}
                                    onCommentChange={setNewCommentBody}
                                    onAddComment={handleAddComment}
                                    addCommentLoading={addCommentLoading}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'timeline' && (
                    timelineLoading
                        ? <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /><span className="ml-2 font-bold">Loading timeline...</span></div>
                        : <ActivityTimeline accountId={accountId} activities={timelineActivities.length > 0 ? timelineActivities : history.activities} />
                )}

                {activeTab === 'analytics' && (
                    <div className="space-y-12">
                        <MetricsHistoryChart data={history.metrics} />
                        <SentimentTrendChart data={history.sentiment} />
                    </div>
                )}
            </div>
        </div>
    );
}
