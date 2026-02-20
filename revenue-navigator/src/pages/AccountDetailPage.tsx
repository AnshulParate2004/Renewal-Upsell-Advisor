import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TrendingUp, AlertTriangle, Users, Building2, Clock, BarChart3, ArrowLeft, Mail, Phone, Edit2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency, getDaysUntil } from "@/data/mockData";
import { generateHistoricalData } from "@/data/historicalDataGenerator";
import MetricsHistoryChart from "@/components/charts/MetricsHistoryChart";
import SentimentTrendChart from "@/components/charts/SentimentTrendChart";
import ActivityTimeline from "@/components/ActivityTimeline";
import { useAccount } from "@/hooks/useAccounts";
import { usePredictions } from "@/hooks/usePredictions";

export default function AccountDetailPage() {
    const { accountId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'analytics'>('overview');

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

    // Generate historical data (accountWithPredictions is guaranteed to exist here)
    const history = generateHistoricalData(accountWithPredictions);

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
                                { label: 'ANNUAL_REVENUE', value: formatCurrency(accountWithPredictions.arr), icon: <TrendingUp size={16} />, iconColor: 'text-foreground' },
                                { label: 'RENEWAL_HORIZON', value: `T-${getDaysUntil(accountWithPredictions.renewalDate)}D`, alert: getDaysUntil(accountWithPredictions.renewalDate) <= 30, icon: <Clock size={16} />, iconColor: 'text-foreground' },
                                { label: 'UTILIZATION_INDEX', value: `${accountWithPredictions.licensesUsed}/${accountWithPredictions.licensesTotal}`, icon: <Users size={16} />, iconColor: 'text-foreground' },
                                { label: 'DEPLOYMENT_STAGE', value: accountWithPredictions.renewalStage.toUpperCase(), icon: <BarChart3 size={16} />, iconColor: 'text-foreground' }
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

                        {/* Analytic Intelligence */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Health & Risk */}
                            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Health Score */}
                                <div className="bg-white border-2 border-black rounded-lg p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-[10px] font-black tracking-widest uppercase text-foreground/60">HEALTH_INDEX</h3>
                                        <span className={`text-2xl font-black tracking-tight ${accountWithPredictions.healthScore >= 70 ? 'text-success' : accountWithPredictions.healthScore >= 40 ? 'text-warning' : 'text-destructive'}`}>
                                            {accountWithPredictions.healthScore}%
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-50 rounded-lg overflow-hidden border-2 border-black/10">
                                        <div
                                            className={`h-full transition-all duration-500 ${accountWithPredictions.healthScore >= 70 ? 'bg-success' : accountWithPredictions.healthScore >= 40 ? 'bg-warning' : 'bg-destructive'}`}
                                            style={{ width: `${accountWithPredictions.healthScore}%` }}
                                        />
                                    </div>
                                    <p className="text-[9px] font-black text-foreground/60 mt-3 uppercase tracking-widest">STABILITY_METRIC: NOMINAL</p>
                                </div>

                                {/* Churn Risk */}
                                <div className="bg-foreground border-2 border-black rounded-lg p-5 text-white relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-[10px] font-black tracking-widest uppercase text-white/60">RISK_ARCHITECTURE</h3>
                                            <AlertTriangle className={`w-4 h-4 ${accountWithPredictions.churnProbability >= 0.7 ? 'text-destructive' : 'text-primary'}`} />
                                        </div>
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <p className="text-3xl font-black tracking-tight mb-1">{Math.round(accountWithPredictions.churnProbability * 100)}%</p>
                                                <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">CHURN_PROBABILITY</p>
                                            </div>
                                            <div className="px-2 py-0.5 bg-white border-2 border-black rounded-md text-[9px] font-black text-foreground uppercase tracking-widest shadow-sm">
                                                {accountWithPredictions.riskScore >= 70 ? 'CRITICAL' : 'STABLE'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sentiment Audit */}
                                <div className="md:col-span-2 bg-white border-2 border-black rounded-lg p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-[10px] font-black tracking-widest uppercase text-foreground/60">SENTIMENT_AUDIT_STREAM</h3>
                                        <span className="px-2 py-0.5 bg-white border-2 border-black rounded-md text-[9px] font-black text-foreground/60 uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">P_IDX: {accountWithPredictions.sentimentScore.toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="w-8 h-8 flex items-center justify-center bg-white border-2 border-black rounded-lg text-3xl shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                            {getSentimentEmoji(accountWithPredictions.sentimentScore)}
                                        </div>
                                        <div>
                                            <h4 className={`text-xl font-black tracking-tight mb-1 uppercase ${getSentimentColor(accountWithPredictions.sentimentScore)}`}>
                                                {getSentimentLabel(accountWithPredictions.sentimentScore)}
                                            </h4>
                                            <p className="text-xs font-black text-foreground/60 uppercase tracking-wider leading-snug">
                                                Linguistic patterns indicate a {getSentimentLabel(accountWithPredictions.sentimentScore).toLowerCase()} trajectory.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Relationship Pulse */}
                            <div className="bg-primary/5 border-2 border-black rounded-lg p-5 flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                                <div>
                                    <h3 className="text-[10px] font-black tracking-widest uppercase text-primary/60 mb-6">RELATIONSHIP_PULSE</h3>
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className="text-4xl font-black text-primary tracking-tight">{accountWithPredictions.relationshipScore}%</span>
                                        <span className="text-xs font-black text-primary/40 uppercase tracking-widest">CORE</span>
                                    </div>
                                    <p className="text-[9px] font-black text-primary/40 uppercase tracking-widest mb-8">ENGAGEMENT MATRIX</p>
                                </div>
                                <div className="space-y-3">
                                    <div className="h-1 bg-primary/10 rounded-lg w-full border border-black/10">
                                        <div className="h-full bg-primary rounded-lg transition-all duration-1000" style={{ width: `${accountWithPredictions.relationshipScore}%` }} />
                                    </div>
                                    <p className="text-[9px] font-black text-primary/60 uppercase tracking-widest">SYNC_STATUS: ESTABLISHED</p>
                                </div>
                            </div>
                        </div>

                        {/* Primary Contact */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-extrabold tracking-widest uppercase text-gray-400 flex items-center gap-2">
                                <Users size={14} />
                                PRIMARY_STAKEHOLDER_RECORD
                            </h3>
                            <ContactInfoSection account={accountWithPredictions} />
                        </div>

                        {/* Account Information */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-primary" />
                                <h3 className="text-[10px] font-extrabold tracking-widest uppercase text-gray-400">METADATA_REGISTRY</h3>
                                <div className="h-px flex-1 bg-gray-100" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { label: 'ASSIGNED_CSM', value: accountWithPredictions.csm },
                                    { label: 'LAST_UPLINK', value: accountWithPredictions.lastContact },
                                    { label: 'CONTRACT_ROOT', value: accountWithPredictions.contractStart, mono: true },
                                    { label: 'RENEWAL_NODE', value: accountWithPredictions.renewalDate, mono: true }
                                ].map((field, i) => (
                                    <div key={i} className="bg-white border-2 border-black rounded-lg p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all group">
                                        <p className="text-[9px] uppercase font-black text-foreground/60 tracking-widest mb-2">{field.label}</p>
                                        <p className={`text-base font-black text-foreground tracking-tight uppercase ${field.mono ? 'font-mono' : ''}`}>
                                            {field.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'timeline' && (
                    <ActivityTimeline activities={history.activities} />
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
function ContactInfoSection({ account }: { account: any }) {
    const [isEditing, setIsEditing] = useState(false);
    const [contactName, setContactName] = useState(account.contactName || "");
    const [contactEmail, setContactEmail] = useState(account.contactEmail || "");
    const [contactPhone, setContactPhone] = useState(account.contactPhone || "");

    const handleSave = () => {
        // In real app, this would call an API
        console.log("Saving contact:", { contactName, contactEmail, contactPhone });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setContactName(account.contactName || "");
        setContactEmail(account.contactEmail || "");
        setContactPhone(account.contactPhone || "");
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
                        <h4 className="text-[9px] font-black uppercase tracking-widest text-foreground/60 mb-1">PRIMARY_STAKEHOLDER</h4>
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
                            className="px-4 py-2 bg-primary text-white border-2 border-black rounded-lg text-[9px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                        >
                            COMMIT_CHANGES
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
                        <label className="text-[9px] uppercase font-black text-gray-400 tracking-widest">SECURE_COMMUNICATION_PATH</label>
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
                </div>

                <div className="space-y-6">
                    {/* Phone */}
                    <div className="space-y-3">
                        <label className="text-[9px] uppercase font-black text-gray-400 tracking-widest">DIRECT_VOICE_UPLINK</label>
                        {isEditing ? (
                            <input
                                type="tel"
                                value={contactPhone}
                                onChange={(e) => setContactPhone(e.target.value)}
                                className="w-2/3 px-4 py-2 bg-white border-2 border-black rounded-lg text-sm font-black text-foreground uppercase tracking-wide focus:outline-none focus:bg-primary/5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            />
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
