import { useState } from "react";
import { X, TrendingUp, AlertTriangle, Users, Building2, Clock, BarChart3, Mail, Phone, Edit2 } from "lucide-react";
import { Account, formatCurrency, getDaysUntil, getRenewalInDays } from "@/data/mockData";
import { motion, AnimatePresence } from "framer-motion";
import { generateHistoricalData } from "@/data/historicalDataGenerator";
import MetricsHistoryChart from "./charts/MetricsHistoryChart";
import SentimentTrendChart from "./charts/SentimentTrendChart";
import ActivityTimeline from "./ActivityTimeline";

interface AccountDetailProps {
    account: Account | null;
    onClose: () => void;
}

export default function AccountDetail({ account, onClose }: AccountDetailProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'analytics'>('overview');

    if (!account) return null;

    const history = generateHistoricalData(account);

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
        <AnimatePresence>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 transition-all"
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="fixed inset-4 z-50 flex items-center justify-center pointer-events-none"
            >
                <div className="bg-white shadow-2xl shadow-purple-900/20 w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col pointer-events-auto rounded-[2.5rem] border border-gray-100 relative">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-primary rounded-t-[2.5rem]"></div>

                    {/* Header */}
                    <div className="p-8 md:p-10 flex items-center justify-between shrink-0 border-b border-gray-50">
                        <div className="flex items-center gap-6">
                            <div className="h-16 w-16 flex items-center justify-center bg-primary/5 rounded-2xl border border-primary/10 group">
                                <Building2 className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                            </div>
                            <div>
                                <div className="flex items-center gap-4">
                                    <h2 className="text-3xl font-extrabold text-foreground tracking-tight leading-none">{account.name}</h2>
                                    <div className="sticker-outline bg-primary/5 text-primary border-primary/10 px-3 py-1 font-bold text-[9px] tracking-widest">DETAILED_VIEW</div>
                                </div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                                    {account.industry} <span className="w-1 h-1 bg-gray-200 rounded-full" /> ID_{account.id}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="h-12 w-12 flex items-center justify-center bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all group"
                        >
                            <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="bg-white border-b border-gray-50 flex px-8 shrink-0">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-8 py-6 text-xs font-extrabold uppercase tracking-[0.2em] transition-all flex items-center gap-3 relative group ${activeTab === tab.id
                                    ? 'text-primary'
                                    : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                <span className={activeTab === tab.id ? 'text-primary' : 'text-gray-300'}>{tab.icon}</span>
                                {tab.label}
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="activeTabModal"
                                        className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-white">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {activeTab === 'overview' && (
                                <div className="space-y-12">
                                    {/* Key Metrics Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {[
                                            { label: 'Revenue', value: (() => { const v = account.mrr != null ? account.mrr : (account.arr != null ? account.arr / 12 : null); return v != null ? formatCurrency(v) : '—'; })(), icon: <TrendingUp size={18} /> },
                                            { label: 'Renewal in days', value: `${getRenewalInDays(account.renewalDate, account.contractEnd, account.status) ?? getDaysUntil(account.renewalDate)} days`, alert: (getRenewalInDays(account.renewalDate, account.contractEnd, account.status) ?? 999) <= 30, icon: <Clock size={18} /> },
                                            { label: 'Licence Used', value: (() => { const u = account.licensesUsed ?? 0; const t = account.licensesTotal ?? 0; const pct = t ? Math.round((u / t) * 100) : 0; return `${pct}%`; })(), icon: <Users size={18} /> },
                                            { label: 'Stage', value: (() => { const s = (account.renewalStage || '').toLowerCase(); if (['q1','q2','q3','q4'].includes(s)) return s.toUpperCase(); if (s === 'renewed' || s === 'lost') return s.toUpperCase(); if (s === 't30') return 'Q1'; if (s === 't60') return 'Q2'; if (s === 't90') return 'Q4'; return s ? s.toUpperCase() : '—'; })(), icon: <BarChart3 size={18} /> }
                                        ].map((m, i) => (
                                            <div key={i} className="paper-card p-6 bg-white border border-gray-100 shadow-xl shadow-purple-900/5 group hover:border-primary/20 transition-all">
                                                <div className="flex items-center justify-between mb-6">
                                                    <div className="p-2.5 bg-gray-50 text-gray-400 group-hover:text-primary group-hover:bg-primary/5 rounded-xl transition-colors">
                                                        {m.icon}
                                                    </div>
                                                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">{m.label}</p>
                                                </div>
                                                <p className={`text-3xl font-extrabold tracking-tight ${m.alert ? 'text-red-500' : 'text-foreground'}`}>
                                                    {m.value}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Intelligence Section: Health Score, Sentiment Analysis, Relationship Score */}
                                    <div className="space-y-8">
                                        {/* Health Score */}
                                        <div className="paper-card p-8 bg-white border border-gray-100 shadow-xl shadow-purple-900/5 rounded-3xl">
                                            <div className="flex items-center justify-between mb-8">
                                                <h3 className="text-sm font-bold text-foreground">Health Score</h3>
                                                <span className={`text-3xl font-extrabold tracking-tight ${account.healthScore >= 70 ? 'text-emerald-500' : account.healthScore >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
                                                    {account.healthScore}
                                                </span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-500 ${account.healthScore >= 70 ? 'bg-emerald-500' : account.healthScore >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                    style={{ width: `${account.healthScore}` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Churn (risk / churn probability) */}
                                        <div className="paper-card p-8 bg-foreground text-white border-none shadow-2xl shadow-purple-900/20 rounded-3xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
                                            <div className="relative z-10">
                                                <div className="flex items-center justify-between mb-8">
                                                    <h3 className="text-sm font-bold text-white/90">Churn probability</h3>
                                                    <span className={`text-3xl font-extrabold tracking-tight ${account.churnProbability >= 0.7 ? 'text-red-500' : 'text-white'}`}>
                                                        {Math.round(account.churnProbability * 100)}%
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-medium text-white/70">Probability</span>
                                                    <div className="px-3 py-1 bg-primary rounded-lg text-xs font-bold uppercase tracking-wider">
                                                        {account.riskScore >= 70 ? 'Critical' : 'Stable'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sentiment Analysis */}
                                        <div className="paper-card p-8 bg-white border border-gray-100 shadow-xl shadow-purple-900/5 rounded-3xl">
                                            <div className="flex items-center justify-between mb-8">
                                                <h3 className="text-sm font-bold text-foreground">Sentiment Analysis</h3>
                                                <span className="text-xs font-medium text-gray-500">Score: {account.sentimentScore.toFixed(2)}</span>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <span className="text-4xl">{getSentimentEmoji(account.sentimentScore)}</span>
                                                <div>
                                                    <p className={`text-2xl font-extrabold tracking-tight leading-none mb-1 ${getSentimentColor(account.sentimentScore)}`}>
                                                        {getSentimentLabel(account.sentimentScore)}
                                                    </p>
                                                    <p className="text-sm text-gray-600">Overall customer sentiment is {getSentimentLabel(account.sentimentScore).toLowerCase()}.</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Relationship Score */}
                                        <div className="paper-card p-8 bg-primary/5 border border-primary/20 shadow-xl shadow-purple-900/5 rounded-3xl">
                                            <h3 className="text-sm font-bold text-primary mb-8">Relationship Score</h3>
                                            <div className="flex items-baseline gap-2 mb-2">
                                                <span className="text-4xl font-extrabold text-primary tracking-tight">{account.relationshipScore}</span>
                                            </div>
                                            <div className="w-full h-2 bg-primary/10 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${account.relationshipScore}` }} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact Section */}
                                    <div className="space-y-6">
                                        <h3 className="text-[11px] font-extrabold tracking-widest uppercase text-gray-400 flex items-center gap-3">
                                            <Users size={16} />
                                            CUSTOMER_INFORMATION
                                        </h3>
                                        <ContactInfoSection account={account} />
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
                        </motion.div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-4 shrink-0">
                        <button
                            onClick={onClose}
                            className="btn-punch px-8 py-4 bg-white text-gray-400 text-[10px] font-black uppercase tracking-widest"
                        >
                            DISMISS
                        </button>
                        <button className="btn-punch px-10 py-4 bg-primary text-white shadow-lg shadow-primary/20 text-[10px] font-black uppercase tracking-widest">
                            INITIATE_PIPELINE_ACTION
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

// Contact Information Section with Editing
function ContactInfoSection({ account }: { account: Account }) {
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
            <div className="p-10 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 text-center">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">No stakeholder info available</p>
            </div>
        );
    }

    return (
        <div className="paper-card p-8 bg-white border border-gray-50 shadow-xl shadow-purple-900/5 rounded-3xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-5">
                    <div className="h-14 w-14 flex items-center justify-center bg-primary/5 rounded-xl border border-primary/10">
                        <Users className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                        <p className="text-[9px] font-extrabold uppercase tracking-widest text-gray-400 mb-1">STAKEHOLDER</p>
                        <p className="text-xl font-extrabold tracking-tight text-foreground">{contactName || "UNASSIGNED"}</p>
                    </div>
                </div>
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="btn-punch px-5 py-3 bg-gray-50 text-gray-400 hover:text-primary text-[9px] font-black uppercase tracking-widest"
                    >
                        <Edit2 size={12} className="mr-2" />
                        MODIFY
                    </button>
                ) : (
                    <div className="flex gap-3">
                        <button
                            onClick={handleCancel}
                            className="btn-punch px-5 py-3 bg-white text-gray-400 text-[9px] font-black uppercase tracking-widest"
                        >
                            ABORT
                        </button>
                        <button
                            onClick={handleSave}
                            className="btn-punch px-5 py-3 bg-primary text-white text-[9px] font-black uppercase tracking-widest"
                        >
                            COMMIT
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Email Section */}
                <div className="space-y-4">
                    <label className="text-[9px] uppercase font-black text-gray-400 tracking-widest">EMAIL_PATH</label>
                    {isEditing ? (
                        <input
                            type="email"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                        />
                    ) : (
                        <a
                            href={`mailto:${contactEmail}`}
                            className="flex items-center gap-4 text-sm font-bold text-foreground hover:text-primary transition-colors group"
                        >
                            <div className="p-2 bg-gray-50 rounded-lg group-hover:text-primary transition-colors">
                                <Mail size={16} />
                            </div>
                            {contactEmail || "NOT_DEFINED"}
                        </a>
                    )}
                </div>

                {/* Phone Section */}
                <div className="space-y-4">
                    <label className="text-[9px] uppercase font-black text-gray-400 tracking-widest">VOICE_LINK</label>
                    {isEditing ? (
                        <input
                            type="tel"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                        />
                    ) : (
                        <a
                            href={`tel:${contactPhone}`}
                            className="flex items-center gap-4 text-sm font-bold text-foreground hover:text-primary transition-colors group"
                        >
                            <div className="p-2 bg-gray-50 rounded-lg group-hover:text-primary transition-colors">
                                <Phone size={16} />
                            </div>
                            <span className="font-mono">{contactPhone || "NOT_DEFINED"}</span>
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
