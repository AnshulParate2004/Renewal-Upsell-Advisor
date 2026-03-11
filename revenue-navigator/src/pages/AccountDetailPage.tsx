import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TrendingUp, AlertTriangle, Users, Building2, Clock, BarChart3, ArrowLeft, Mail, Phone, Edit2, Loader2, MessageSquare } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function AccountDetailPage() {
    const { accountId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'analytics'>('overview');
    const [comments, setComments] = useState<AccountComment[]>([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [newCommentBody, setNewCommentBody] = useState('');
    const [addCommentLoading, setAddCommentLoading] = useState(false);
    const [timelineActivities, setTimelineActivities] = useState<AccountActivity[]>([]);
    const [timelineLoading, setTimelineLoading] = useState(false);

    const { data: account, isLoading, error } = useAccount(accountId || '');

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

    // Merge account with predictions (use account data as base, predictions override if available)
    const accountWithPredictions = account ? {
        ...account,
        // Override with predictions if available from nested structure
        healthScore: predictions?.predictions?.health_score?.prediction_value ?? account.healthScore,
        riskScore: predictions?.predictions?.churn?.prediction_value ?? account.riskScore,
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
        if (score > 0.5) return "😊";
        if (score > 0) return "🙂";
        if (score > -0.5) return "😐";
        return "😟";
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

    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="bg-white border-b-2 border-black p-4">
                <div className="max-w-7xl mx-auto flex flex-col gap-6">
                    <div>
                        <button
                            onClick={() => navigate(-1)}
                            className="group px-3 py-1.5 bg-white text-foreground/60 hover:text-primary hover:bg-primary/5 border-2 border-black rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]"
                        >
                            <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
                            BACK_TO_COMMAND_CENTER
                        </button>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 flex items-center justify-center bg-primary border-2 border-black rounded-lg relative overflow-hidden group shrink-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                                <Building2 className="h-8 w-8 text-white relative z-10" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-3xl font-black text-foreground tracking-tight leading-none uppercase">
                                        {accountWithPredictions.name}
                                    </h1>
                                    <div className="px-2 py-0.5 bg-success text-white border-2 border-black rounded-md font-black text-[9px] uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                        ACTIVE_ENTITY
                                    </div>
                                </div>
                                <p className="text-xs font-black text-foreground/60 uppercase tracking-wider">
                                    {accountWithPredictions.industry?.toUpperCase() || 'N/A'} <span className="mx-2 text-foreground/30">/</span> ID: {accountWithPredictions.id}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="px-6 py-3 bg-primary text-white border-2 border-black rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 group shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                                <Edit2 size={14} />
                                MODIFY_DATA
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b-2 border-black px-6">
                <div className="max-w-7xl mx-auto flex">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-4 text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 relative group ${activeTab === tab.id
                                ? 'text-primary'
                                : 'text-foreground/40 hover:text-foreground/60'
                                }`}
                        >
                            <span className={activeTab === tab.id ? 'text-primary' : 'text-foreground/30'}>{tab.icon}</span>
                            {tab.label}
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-0 right-0 h-1 bg-primary"
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-[1600px] mx-auto p-6">
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        {/* Key Metrics Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: 'Revenue', value: (() => { const v = accountWithPredictions.mrr != null ? accountWithPredictions.mrr : (accountWithPredictions.arr != null ? accountWithPredictions.arr / 12 : null); return v != null ? formatCurrency(v) : '—'; })(), icon: <TrendingUp size={16} />, iconColor: 'text-foreground' },
                                { label: 'Renewal in days', value: `${getRenewalInDays(accountWithPredictions.renewalDate, accountWithPredictions.contractEnd, accountWithPredictions.status) ?? getDaysUntil(accountWithPredictions.renewalDate)} days`, alert: (getRenewalInDays(accountWithPredictions.renewalDate, accountWithPredictions.contractEnd, accountWithPredictions.status) ?? 999) <= 30, icon: <Clock size={16} />, iconColor: 'text-foreground' },
                                { label: 'Licence Used', value: (() => { const u = accountWithPredictions.licensesUsed ?? 0; const t = accountWithPredictions.licensesTotal ?? 0; const pct = t ? Math.round((u / t) * 100) : 0; return `${u}/${t} (${pct}%)`; })(), icon: <Users size={16} />, iconColor: 'text-foreground' },
                                { label: 'Stage', value: (() => { const s = (accountWithPredictions.renewalStage || '').toLowerCase(); if (['q1','q2','q3','q4'].includes(s)) return s.toUpperCase(); if (s === 'renewed' || s === 'lost') return s.toUpperCase(); if (s === 't30') return 'Q1'; if (s === 't60') return 'Q2'; if (s === 't90') return 'Q4'; return s ? s.toUpperCase() : '—'; })(), icon: <BarChart3 size={16} />, iconColor: 'text-foreground' }
                            ].map((m, i) => (
                                <div key={i} className="bg-white border-2 border-black rounded-lg p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all group cursor-default">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-8 h-8 p-1.5 bg-white border-2 border-black rounded-lg flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                            <div className={m.iconColor}>
                                                {m.icon}
                                            </div>
                                        </div>
                                        <p className="text-[9px] uppercase font-black text-foreground/60 tracking-widest">{m.label}</p>
                                    </div>
                                    <p className={`text-2xl font-black tracking-tight ${m.alert ? 'text-red-600' : 'text-foreground'}`}>
                                        {m.value}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Left: Account card (shifted from right). Right: Comments container. */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Account card - consolidated metrics on the left */}
                            <div className="bg-card border-2 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4 h-fit">
                                <h3 className="text-sm font-bold text-foreground border-b-2 border-black pb-2">Account card</h3>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Health Score</p>
                                        <p className={`text-xl font-black ${accountWithPredictions.healthScore >= 70 ? 'text-success' : accountWithPredictions.healthScore >= 40 ? 'text-warning' : 'text-destructive'}`}>
                                            {accountWithPredictions.healthScore}
                                        </p>
                                        <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div className={`h-full ${accountWithPredictions.healthScore >= 70 ? 'bg-success' : accountWithPredictions.healthScore >= 40 ? 'bg-warning' : 'bg-destructive'}`} style={{ width: `${accountWithPredictions.healthScore}%` }} />
                                        </div>
                                    </div>
                                    <div className="bg-foreground text-white rounded-lg p-3">
                                        <p className="text-[10px] font-medium text-white/70 uppercase tracking-wider mb-1">Churn probability</p>
                                        <p className="text-xl font-black">{Math.round(accountWithPredictions.churnProbability * 100)}%</p>
                                        <p className="text-[10px] text-white/70">Probability</p>
                                        <span className="inline-block mt-2 px-2 py-0.5 bg-white text-foreground text-[10px] font-bold rounded border border-black">
                                            {accountWithPredictions.riskScore >= 70 ? 'Critical' : 'Stable'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Sentiment Analysis</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{getSentimentEmoji(accountWithPredictions.sentimentScore)}</span>
                                            <p className={`text-lg font-black ${getSentimentColor(accountWithPredictions.sentimentScore)}`}>
                                                {getSentimentLabel(accountWithPredictions.sentimentScore)}
                                            </p>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">Score: {accountWithPredictions.sentimentScore.toFixed(2)}</p>
                                        <p className="text-xs text-foreground/70 mt-1">Overall customer sentiment is {getSentimentLabel(accountWithPredictions.sentimentScore).toLowerCase()}.</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-medium text-primary uppercase tracking-wider mb-1">Relationship Score</p>
                                        <p className="text-2xl font-black text-primary">{accountWithPredictions.relationshipScore}</p>
                                        <div className="mt-1 h-1.5 bg-primary/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary rounded-full" style={{ width: `${accountWithPredictions.relationshipScore}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Comments container - list + bar to add comment */}
                            <div className="bg-card border-2 border-black rounded-xl p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col min-h-[280px]">
                                <h3 className="text-sm font-bold text-foreground border-b-2 border-black pb-2 flex items-center gap-2">
                                    <MessageSquare size={16} /> Comments
                                </h3>
                                <div className="flex gap-2 mt-4">
                                    <Textarea
                                        placeholder="Add a comment..."
                                        value={newCommentBody}
                                        onChange={(e) => setNewCommentBody(e.target.value)}
                                        className="min-h-[72px] border-2 border-black resize-none flex-1"
                                        disabled={addCommentLoading}
                                    />
                                    <Button
                                        onClick={handleAddComment}
                                        disabled={!newCommentBody.trim() || addCommentLoading}
                                        className="shrink-0 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                    >
                                        {addCommentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                                    </Button>
                                </div>
                                <div className="border-t-2 border-black/10 mt-4 pt-4 flex-1 min-h-0 overflow-y-auto space-y-2">
                                    {commentsLoading ? (
                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Loading comments...
                                        </p>
                                    ) : comments.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No comments yet. Add one above.</p>
                                    ) : (
                                        comments.map((c) => (
                                            <div key={c.id} className="text-sm p-3 rounded-lg bg-muted/50 border-2 border-black/10">
                                                <p className="text-foreground">{c.body}</p>
                                                <p className="text-[10px] text-muted-foreground mt-1">{new Date(c.created_at).toLocaleString()}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Primary Contact / Customer information */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-extrabold tracking-widest uppercase text-gray-400 flex items-center gap-2">
                                <Users size={14} />
                                CUSTOMER_INFORMATION
                            </h3>
                            <ContactInfoSection 
                                account={accountWithPredictions} 
                                accountId={accountId || ''} 
                            />
                        </div>

                        {/* Account Information */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-primary" />
                                <h3 className="text-[10px] font-extrabold tracking-widest uppercase text-gray-400">CUSTOMER TABLE</h3>
                                <div className="h-px flex-1 bg-gray-100" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { label: 'Partner name', value: accountWithPredictions.partnerName ?? accountWithPredictions.csm }
                                ].map((field, i) => (
                                    <div key={i} className="bg-white border-2 border-black rounded-lg p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all group">
                                        <p className="text-[9px] uppercase font-black text-foreground/60 tracking-widest mb-2">{field.label}</p>
                                        <p className="text-base font-black text-foreground tracking-tight uppercase">
                                            {field.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'timeline' && (
                    timelineLoading
                        ? <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /><span className="ml-2 font-bold">Loading timeline...</span></div>
                        : <ActivityTimeline activities={timelineActivities.length > 0 ? timelineActivities : history.activities} />
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

// Contact Information Section with Editing
function ContactInfoSection({ account, accountId }: { account: any, accountId: string }) {
    const [isEditing, setIsEditing] = useState(false);
    const [contactName, setContactName] = useState(account.contactName || "");
    const [contactEmail, setContactEmail] = useState(account.contactEmail || "");
    const [contactPhone, setContactPhone] = useState(account.contactPhone || "");
    const [contactCity, setContactCity] = useState(account.contactCity || "");
    const [contactState, setContactState] = useState(account.contactState || "");
    const [phoneError, setPhoneError] = useState("");
    
    const updateAccount = useUpdateAccount();

    const handleSave = async () => {
        // Validate phone number format: +91 XXXXXXXXXX (10 digits)
        const phoneRegex = /^\+91 \d{10}$/;
        if (!phoneRegex.test(contactPhone)) {
            setPhoneError("Please write in format: +91 1234567890 (must have 10 digits)");
            return;
        }
        setPhoneError("");

        try {
            await updateAccount.mutateAsync({
                id: accountId,
                data: {
                    contactName,
                    contactEmail,
                    contactPhone: contactPhone,
                    contactCity,
                    contactState
                }
            });
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to save contact:", error);
        }
    };

    const handleCancel = () => {
        setContactName(account.contactName || "");
        setContactEmail(account.contactEmail || "");
        setContactPhone(account.contactPhone || "");
        setContactCity(account.contactCity || "");
        setContactState(account.contactState || "");
        setPhoneError("");
        setIsEditing(false);
    };

    if (!account.contactName && !account.contactEmail && !account.contactPhone) {
        return (
            <div className="p-12 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-300 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-sm text-gray-400 font-bold uppercase tracking-wider">No stakeholder information available</p>
                <button
                    onClick={() => setIsEditing(true)}
                    className="mt-6 text-primary hover:text-primary/80 text-[10px] font-black uppercase tracking-widest"
                >
                    + REGISTER_CONTACT
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white border-2 border-black rounded-lg p-6 relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 flex items-center justify-center bg-primary border-2 border-black rounded-lg shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-foreground/60 mb-1">CUSTOMER NAME</h4>
                        <p className="text-xl font-black tracking-tight text-foreground uppercase">{contactName || "UNASSIGNED"}</p>
                    </div>
                </div>
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-foreground text-white border-2 border-black rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                    >
                        <Edit2 size={12} />
                        MODIFY_RECORD
                    </button>
                ) : (
                    <div className="flex gap-3">
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 bg-white text-foreground border-2 border-black rounded-lg text-[9px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                        >
                            ABORT
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={updateAccount.isPending}
                            className="px-4 py-2 bg-primary text-white border-2 border-black rounded-lg text-[9px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {updateAccount.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                            {updateAccount.isPending ? 'COMMITTING...' : 'COMMIT_CHANGES'}
                        </button>
                    </div>
                )}
            </div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                    {/* Name Edit */}
                    {isEditing && (
                        <div className="space-y-2">
                            <label className="text-[9px] uppercase font-black text-gray-400 tracking-widest">STAKEHOLDER_NAME</label>
                            <input
                                type="text"
                                value={contactName}
                                onChange={(e) => setContactName(e.target.value)}
                                className="w-2/3 px-4 py-2 bg-white border-2 border-black rounded-lg text-sm font-black text-foreground uppercase tracking-wide focus:outline-none focus:bg-primary/5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            />
                        </div>
                    )}

                    {/* Email */}
                    <div className="space-y-3">
                        <label className="text-[9px] uppercase font-black text-gray-400 tracking-widest">EMAIL</label>
                        {isEditing ? (
                            <input
                                type="email"
                                value={contactEmail}
                                onChange={(e) => setContactEmail(e.target.value)}
                                className="w-2/3 px-4 py-2 bg-white border-2 border-black rounded-lg text-sm font-black text-foreground uppercase tracking-wide focus:outline-none focus:bg-primary/5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            />
                        ) : (
                            <div className="bg-white border-2 border-black rounded-lg p-4 group shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all">
                                <a
                                    href={`mailto:${contactEmail}`}
                                    className="text-sm font-black text-foreground hover:text-primary transition-colors flex items-center gap-3 uppercase tracking-wide"
                                >
                                    <div className="w-8 h-8 p-1.5 bg-white border-2 border-black rounded-lg text-foreground/60 flex items-center justify-center shrink-0 group-hover:text-primary transition-colors shadow-sm">
                                        <Mail size={14} />
                                    </div>
                                    {contactEmail || "NOT_DEFINED"}
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Contract & renewal dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-3">
                            <label className="text-[9px] uppercase font-black text-gray-400 tracking-widest">CONTRACT START DATE</label>
                            <div className="bg-white border-2 border-black rounded-lg p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                <span className="text-sm font-black text-foreground font-mono uppercase tracking-wide">{account.contractStart || "N/A"}</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[9px] uppercase font-black text-gray-400 tracking-widest">CONTRACT END DATE</label>
                            <div className="bg-white border-2 border-black rounded-lg p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                <span className="text-sm font-black text-foreground font-mono uppercase tracking-wide">{account.contractEnd || "N/A"}</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[9px] uppercase font-black text-gray-400 tracking-widest">RENEWAL DATE</label>
                            <div className="bg-white border-2 border-black rounded-lg p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                <span className="text-sm font-black text-foreground font-mono uppercase tracking-wide">{account.renewalDate || "N/A"}</span>
                            </div>
                        </div>
                    </div>

                    {/* CSM info under dates */}
                    <div className="mt-4 space-y-3">
                        <label className="text-[9px] uppercase font-black text-gray-400 tracking-widest">CUSTOMER SUCCESS MANAGER</label>
                        <div className="bg-white border-2 border-black rounded-lg p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <span className="text-sm font-black text-foreground uppercase tracking-wide">
                                {account.csm || "N/A"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Phone */}
                    <div className="space-y-3">
                        <label className="text-[9px] uppercase font-black text-gray-400 tracking-widest">PHONE NUMBER</label>
                        {isEditing ? (
                            <div className="space-y-1">
                                <input
                                    type="tel"
                                    value={contactPhone}
                                    onChange={(e) => {
                                        setContactPhone(e.target.value);
                                        if (phoneError) setPhoneError("");
                                    }}
                                    placeholder="+91 1234567890"
                                    className={`w-full px-4 py-2 bg-white border-2 rounded-lg text-sm font-black text-foreground uppercase tracking-wide focus:outline-none focus:bg-primary/5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${phoneError ? 'border-red-500' : 'border-black'}`}
                                />
                                {phoneError && <p className="text-[10px] font-bold text-red-500 uppercase">{phoneError}</p>}
                            </div>
                        ) : (
                            <div className="bg-white border-2 border-black rounded-lg p-4 group shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all">
                                <a
                                    href={`tel:${contactPhone}`}
                                    className="text-sm font-black text-foreground hover:text-primary transition-colors flex items-center gap-3 uppercase tracking-wide"
                                >
                                    <div className="w-8 h-8 p-1.5 bg-white border-2 border-black rounded-lg text-foreground/60 flex items-center justify-center shrink-0 group-hover:text-primary transition-colors shadow-sm">
                                        <Phone size={14} />
                                    </div>
                                    <span className="font-mono">{contactPhone || "NOT_DEFINED"}</span>
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Location: City and State */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <label className="text-[9px] uppercase font-black text-gray-400 tracking-widest">CITY</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={contactCity}
                                    onChange={(e) => setContactCity(e.target.value)}
                                    placeholder="City"
                                    className="w-full px-4 py-2 bg-white border-2 border-black rounded-lg text-sm font-black text-foreground uppercase tracking-wide focus:outline-none focus:bg-primary/5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                />
                            ) : (
                                <div className="bg-white border-2 border-black rounded-lg p-3 group shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all">
                                    <div className="text-sm font-black text-foreground flex items-center gap-2 uppercase tracking-wide">
                                        <div className="w-6 h-6 p-1 bg-white border-2 border-black rounded-md text-foreground/60 flex items-center justify-center shrink-0 shadow-sm">
                                            <Building2 size={12} />
                                        </div>
                                        <span className="truncate">{contactCity || "N/A"}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <label className="text-[9px] uppercase font-black text-gray-400 tracking-widest">STATE</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={contactState}
                                    onChange={(e) => setContactState(e.target.value)}
                                    placeholder="State"
                                    className="w-full px-4 py-2 bg-white border-2 border-black rounded-lg text-sm font-black text-foreground uppercase tracking-wide focus:outline-none focus:bg-primary/5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                />
                            ) : (
                                <div className="bg-white border-2 border-black rounded-lg p-3 group shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all">
                                    <div className="text-sm font-black text-foreground flex items-center gap-2 uppercase tracking-wide">
                                        <div className="w-6 h-6 p-1 bg-white border-2 border-black rounded-md text-foreground/60 flex items-center justify-center shrink-0 shadow-sm">
                                            <Building2 size={12} />
                                        </div>
                                        <span className="truncate">{contactState || "N/A"}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white border-2 border-black rounded-lg p-4 flex items-center gap-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all">
                        <div className="w-10 h-10 bg-white border-2 border-black rounded-lg flex items-center justify-center text-lg shrink-0 shadow-sm">
                            💡
                        </div>
                        <p className="text-[9px] font-black text-foreground/60 uppercase leading-relaxed tracking-wider">
                            Last interaction recorded <span className="text-primary font-black">3 DAYS AGO</span> via Automated Voice Path.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
