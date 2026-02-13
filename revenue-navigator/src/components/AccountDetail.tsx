import { useState } from "react";
import { X, TrendingUp, AlertTriangle, Users, Building2, Clock, BarChart3 } from "lucide-react";
import { Account, formatCurrency, getDaysUntil } from "@/data/mockData";
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

    // Generate historical data
    const history = generateHistoricalData(account);

    const getSentimentColor = (score: number) => {
        if (score > 0.5) return "text-emerald-600";
        if (score > 0) return "text-blue-600";
        if (score > -0.5) return "text-yellow-600";
        return "text-red-600";
    };

    const getSentimentLabel = (score: number) => {
        if (score > 0.5) return "Very Positive";
        if (score > 0) return "Positive";
        if (score > -0.5) return "Neutral";
        return "Negative";
    };

    const getSentimentEmoji = (score: number) => {
        if (score > 0.5) return "😊";
        if (score > 0) return "🙂";
        if (score > -0.5) return "😐";
        return "😟";
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <Building2 size={14} /> },
        { id: 'timeline', label: 'Timeline', icon: <Clock size={14} /> },
        { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={14} /> }
    ] as const;

    return (
        <AnimatePresence>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
                <div className="bg-white dark:bg-gray-800 border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto">
                    {/* Header */}
                    <div className="bg-indigo-600 border-b-4 border-black dark:border-white p-4 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                <Building2 className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white uppercase tracking-tight">{account.name}</h2>
                                <p className="text-xs text-white/80 font-mono">{account.industry} • {account.id}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 bg-white hover:bg-red-600 border-2 border-black text-black hover:text-white transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="border-b-4 border-black dark:border-white bg-gray-100 dark:bg-gray-900 flex gap-0 shrink-0">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 px-6 py-3 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-r-2 border-black dark:border-white last:border-r-0 ${activeTab === tab.id
                                        ? 'bg-white dark:bg-gray-800 text-black dark:text-white shadow-[inset_0_4px_0_0_rgba(99,102,241,1)]'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                        {activeTab === 'overview' && (
                            <div>
                                {/* Key Metrics Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    <div className="p-4 bg-white dark:bg-gray-900 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]">
                                        <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-widest mb-1">ARR</p>
                                        <p className="text-2xl font-black text-black dark:text-white font-mono">{formatCurrency(account.arr)}</p>
                                    </div>
                                    <div className="p-4 bg-white dark:bg-gray-900 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]">
                                        <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-widest mb-1">Renewal</p>
                                        <p className={`text-2xl font-black font-mono ${getDaysUntil(account.renewalDate) <= 30 ? 'text-red-600' : 'text-black dark:text-white'}`}>
                                            {getDaysUntil(account.renewalDate)}d
                                        </p>
                                    </div>
                                    <div className="p-4 bg-white dark:bg-gray-900 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]">
                                        <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-widest mb-1">Licenses</p>
                                        <p className="text-2xl font-black text-black dark:text-white font-mono">
                                            {account.licensesUsed}/{account.licensesTotal}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-white dark:bg-gray-900 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]">
                                        <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-widest mb-1">Stage</p>
                                        <p className="text-lg font-black text-black dark:text-white uppercase">{account.renewalStage}</p>
                                    </div>
                                </div>

                                {/* Analytics Section */}
                                <div className="mb-6">
                                    <h3 className="text-sm font-black uppercase tracking-wider text-black dark:text-white mb-3 flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" />
                                        Analytics & Predictions
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Health Score */}
                                        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-2 border-black dark:border-white">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400">Health Score</span>
                                                <span className="text-lg font-black font-mono text-black dark:text-white">{account.healthScore}%</span>
                                            </div>
                                            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 border border-black/20 dark:border-white/20 rounded-sm overflow-hidden">
                                                <div
                                                    className={`h-full ${account.healthScore >= 70 ? 'bg-emerald-500' : account.healthScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                    style={{ width: `${account.healthScore}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Risk Score */}
                                        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-2 border-black dark:border-white">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400">Risk Score</span>
                                                <span className={`inline-flex px-3 py-1 text-[10px] uppercase font-black tracking-wide border-2 border-black ${account.riskScore >= 70
                                                    ? 'bg-red-600 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                                    : account.riskScore >= 40
                                                        ? 'bg-yellow-400 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                                        : 'bg-white text-green-700 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]'
                                                    }`}>
                                                    {account.riskScore >= 70 ? 'HIGH RISK' : account.riskScore >= 40 ? 'MEDIUM' : 'LOW RISK'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Relationship Score */}
                                        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border-2 border-black dark:border-white">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400">Relationship Score</span>
                                                <span className="text-lg font-black font-mono text-black dark:text-white">{account.relationshipScore}%</span>
                                            </div>
                                            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 border border-black/20 dark:border-white/20 rounded-sm overflow-hidden">
                                                <div
                                                    className={`h-full ${account.relationshipScore >= 70 ? 'bg-blue-600' : account.relationshipScore >= 40 ? 'bg-blue-400' : 'bg-blue-300'}`}
                                                    style={{ width: `${account.relationshipScore}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Churn Probability */}
                                        <div className="p-4 bg-red-50 dark:bg-red-950/30 border-2 border-black dark:border-white">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    Churn Probability
                                                </span>
                                                <span className={`text-lg font-black font-mono ${account.churnProbability >= 0.7 ? 'text-red-600' : account.churnProbability >= 0.4 ? 'text-yellow-600' : 'text-green-600'}`}>
                                                    {Math.round(account.churnProbability * 100)}%
                                                </span>
                                            </div>
                                            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 border border-black/20 dark:border-white/20 rounded-sm overflow-hidden">
                                                <div
                                                    className={`h-full ${account.churnProbability >= 0.7 ? 'bg-red-600' : account.churnProbability >= 0.4 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                    style={{ width: `${account.churnProbability * 100}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Sentiment Analysis */}
                                        <div className="p-4 bg-purple-50 dark:bg-purple-950/30 border-2 border-black dark:border-white md:col-span-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400">Sentiment Analysis</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">{getSentimentEmoji(account.sentimentScore)}</span>
                                                    <span className={`text-lg font-black ${getSentimentColor(account.sentimentScore)}`}>
                                                        {getSentimentLabel(account.sentimentScore)}
                                                    </span>
                                                    <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                                                        ({account.sentimentScore > 0 ? '+' : ''}{account.sentimentScore.toFixed(2)})
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Utilization */}
                                        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-2 border-black dark:border-white md:col-span-2">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold uppercase text-gray-600 dark:text-gray-400">Utilization</span>
                                                <span className="text-lg font-black font-mono text-black dark:text-white">{account.utilization}%</span>
                                            </div>
                                            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 border border-black/20 dark:border-white/20 rounded-sm overflow-hidden">
                                                <div
                                                    className={`h-full ${account.utilization > 80 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                                    style={{ width: `${account.utilization}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Information */}
                                <div className="mb-6">
                                    <h3 className="text-sm font-black uppercase tracking-wider text-black dark:text-white mb-3 flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Account Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-2 border-black dark:border-white">
                                            <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-widest mb-1">CSM</p>
                                            <p className="text-sm font-bold text-black dark:text-white">{account.csm}</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-2 border-black dark:border-white">
                                            <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-widest mb-1">Last Contact</p>
                                            <p className="text-sm font-bold text-black dark:text-white">{account.lastContact}</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-2 border-black dark:border-white">
                                            <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-widest mb-1">Contract Start</p>
                                            <p className="text-sm font-bold text-black dark:text-white font-mono">{account.contractStart}</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-2 border-black dark:border-white">
                                            <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-widest mb-1">Renewal Date</p>
                                            <p className="text-sm font-bold text-black dark:text-white font-mono">{account.renewalDate}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'timeline' && (
                            <ActivityTimeline activities={history.activities} />
                        )}

                        {activeTab === 'analytics' && (
                            <div className="space-y-6">
                                <MetricsHistoryChart data={history.metrics} />
                                <SentimentTrendChart data={history.sentiment} />
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t-4 border-black dark:border-white p-4 bg-gray-50 dark:bg-gray-900 flex justify-end gap-2 shrink-0">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-white dark:bg-gray-800 text-black dark:text-white border-2 border-black dark:border-white text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[2px] hover:translate-y-[2px]"
                        >
                            Close
                        </button>
                        <button className="px-6 py-2 bg-indigo-600 text-white border-2 border-black dark:border-white text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[2px] hover:translate-y-[2px]">
                            Take Action
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
