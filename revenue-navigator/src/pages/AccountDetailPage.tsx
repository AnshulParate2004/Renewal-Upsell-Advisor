import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TrendingUp, AlertTriangle, Users, Building2, Clock, BarChart3, ArrowLeft, Mail, Phone, Edit2 } from "lucide-react";
import { accounts, formatCurrency, getDaysUntil } from "@/data/mockData";
import { generateHistoricalData } from "@/data/historicalDataGenerator";
import MetricsHistoryChart from "@/components/charts/MetricsHistoryChart";
import SentimentTrendChart from "@/components/charts/SentimentTrendChart";
import ActivityTimeline from "@/components/ActivityTimeline";

export default function AccountDetailPage() {
    const { accountId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'analytics'>('overview');

    const account = accounts.find(a => a.id === accountId);

    if (!account) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-2xl font-black text-black dark:text-white mb-4">Account Not Found</h2>
                <button
                    onClick={() => navigate(-1)}
                    className="px-6 py-2 bg-indigo-600 text-white border-2 border-black text-xs font-black uppercase"
                >
                    Go Back
                </button>
            </div>
        );
    }

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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-indigo-600 border-b-4 border-black dark:border-white p-6">
                <div className="max-w-7xl mx-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="mb-4 px-4 py-2 bg-white text-black border-2 border-black text-xs font-black uppercase flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                    >
                        <ArrowLeft size={16} />
                        Back
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <Building2 className="w-8 h-8 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white uppercase tracking-tight">{account.name}</h1>
                            <p className="text-sm text-white/80 font-mono">{account.industry} • Account ID: {account.id}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b-4 border-black dark:border-white bg-white dark:bg-gray-800">
                <div className="max-w-7xl mx-auto flex gap-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 px-6 py-4 text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-r-2 border-black dark:border-white last:border-r-0 ${activeTab === tab.id
                                ? 'bg-white dark:bg-gray-800 text-black dark:text-white shadow-[inset_0_4px_0_0_rgba(99,102,241,1)]'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto p-6">
                {activeTab === 'overview' && (
                    <div>
                        {/* Key Metrics Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="p-6 bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]">
                                <p className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400 tracking-widest mb-2">ARR</p>
                                <p className="text-3xl font-black text-black dark:text-white font-mono">{formatCurrency(account.arr)}</p>
                            </div>
                            <div className="p-6 bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]">
                                <p className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400 tracking-widest mb-2">Renewal</p>
                                <p className={`text-3xl font-black font-mono ${getDaysUntil(account.renewalDate) <= 30 ? 'text-red-600' : 'text-black dark:text-white'}`}>
                                    {getDaysUntil(account.renewalDate)}d
                                </p>
                            </div>
                            <div className="p-6 bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]">
                                <p className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400 tracking-widest mb-2">Licenses</p>
                                <p className="text-3xl font-black text-black dark:text-white font-mono">
                                    {account.licensesUsed}/{account.licensesTotal}
                                </p>
                            </div>
                            <div className="p-6 bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]">
                                <p className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400 tracking-widest mb-2">Stage</p>
                                <p className="text-2xl font-black text-black dark:text-white uppercase">{account.renewalStage}</p>
                            </div>
                        </div>

                        {/* Analytics Section */}
                        <div className="mb-6">
                            <h3 className="text-lg font-black uppercase tracking-wider text-black dark:text-white mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" />
                                Analytics & Predictions
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Health Score */}
                                <div className="p-6 bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-bold uppercase text-gray-600 dark:text-gray-400">Health Score</span>
                                        <span className="text-2xl font-black font-mono text-black dark:text-white">{account.healthScore}%</span>
                                    </div>
                                    <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 border-2 border-black/20 dark:border-white/20 rounded-sm overflow-hidden">
                                        <div
                                            className={`h-full ${account.healthScore >= 70 ? 'bg-emerald-500' : account.healthScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                            style={{ width: `${account.healthScore}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Risk Score */}
                                <div className="p-6 bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-bold uppercase text-gray-600 dark:text-gray-400">Risk Score</span>
                                        <span className={`inline-flex px-4 py-1 text-xs uppercase font-black tracking-wide border-2 border-black ${account.riskScore >= 70
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
                                <div className="p-6 bg-blue-50 dark:bg-blue-950/30 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-bold uppercase text-gray-600 dark:text-gray-400">Relationship Score</span>
                                        <span className="text-2xl font-black font-mono text-black dark:text-white">{account.relationshipScore}%</span>
                                    </div>
                                    <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 border-2 border-black/20 dark:border-white/20 rounded-sm overflow-hidden">
                                        <div
                                            className={`h-full ${account.relationshipScore >= 70 ? 'bg-blue-600' : account.relationshipScore >= 40 ? 'bg-blue-400' : 'bg-blue-300'}`}
                                            style={{ width: `${account.relationshipScore}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Churn Probability */}
                                <div className="p-6 bg-red-50 dark:bg-red-950/30 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-bold uppercase text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                            <AlertTriangle className="w-4 h-4" />
                                            Churn Probability
                                        </span>
                                        <span className={`text-2xl font-black font-mono ${account.churnProbability >= 0.7 ? 'text-red-600' : account.churnProbability >= 0.4 ? 'text-yellow-600' : 'text-green-600'}`}>
                                            {Math.round(account.churnProbability * 100)}%
                                        </span>
                                    </div>
                                    <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 border-2 border-black/20 dark:border-white/20 rounded-sm overflow-hidden">
                                        <div
                                            className={`h-full ${account.churnProbability >= 0.7 ? 'bg-red-600' : account.churnProbability >= 0.4 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                            style={{ width: `${account.churnProbability * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Sentiment Analysis */}
                                <div className="p-6 bg-purple-50 dark:bg-purple-950/30 border-2 border-black dark:border-white md:col-span-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold uppercase text-gray-600 dark:text-gray-400">Sentiment Analysis</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl">{getSentimentEmoji(account.sentimentScore)}</span>
                                            <span className={`text-2xl font-black ${getSentimentColor(account.sentimentScore)}`}>
                                                {getSentimentLabel(account.sentimentScore)}
                                            </span>
                                            <span className="text-lg font-mono text-gray-500 dark:text-gray-400">
                                                ({account.sentimentScore > 0 ? '+' : ''}{account.sentimentScore.toFixed(2)})
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Utilization */}
                                <div className="p-6 bg-white dark:bg-gray-800 border-2 border-black dark:border-white md:col-span-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-bold uppercase text-gray-600 dark:text-gray-400">Utilization</span>
                                        <span className="text-2xl font-black font-mono text-black dark:text-white">{account.utilization}%</span>
                                    </div>
                                    <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 border-2 border-black/20 dark:border-white/20 rounded-sm overflow-hidden">
                                        <div
                                            className={`h-full ${account.utilization > 80 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                            style={{ width: `${account.utilization}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Primary Contact Information */}
                        <div className="mb-8">
                            <h3 className="text-lg font-black uppercase tracking-wider text-black dark:text-white mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Primary Contact
                            </h3>
                            <ContactInfoSection account={account} />
                        </div>

                        {/* Account Information */}
                        <div className="mb-6">
                            <h3 className="text-lg font-black uppercase tracking-wider text-black dark:text-white mb-4 flex items-center gap-2">
                                <Building2 className="w-5 h-5" />
                                Account Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="p-6 bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <p className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400 tracking-widest mb-2">CSM</p>
                                    <p className="text-base font-bold text-black dark:text-white">{account.csm}</p>
                                </div>
                                <div className="p-6 bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <p className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400 tracking-widest mb-2">Last Contact</p>
                                    <p className="text-base font-bold text-black dark:text-white">{account.lastContact}</p>
                                </div>
                                <div className="p-6 bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <p className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400 tracking-widest mb-2">Contract Start</p>
                                    <p className="text-base font-bold text-black dark:text-white font-mono">{account.contractStart}</p>
                                </div>
                                <div className="p-6 bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <p className="text-xs uppercase font-bold text-gray-500 dark:text-gray-400 tracking-widest mb-2">Renewal Date</p>
                                    <p className="text-base font-bold text-black dark:text-white font-mono">{account.renewalDate}</p>
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
            <div className="p-8 bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-700 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Users className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-base text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">No primary contact information available</p>
            </div>
        );
    }

    return (
        <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
            <div className="flex items-center justify-between mb-6">
                <h4 className="text-sm font-black uppercase text-blue-800 dark:text-blue-300 tracking-widest">Contact Details</h4>
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-white dark:bg-gray-800 text-black dark:text-white border-2 border-black dark:border-white text-xs font-black uppercase transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px]"
                    >
                        <span className="flex items-center gap-2">
                            <Edit2 size={14} />
                            Edit
                        </span>
                    </button>
                ) : (
                    <div className="flex gap-3">
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 bg-white dark:bg-gray-800 text-black dark:text-white border-2 border-black dark:border-white text-xs font-black uppercase transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-indigo-600 text-white border-2 border-black dark:border-white text-xs font-black uppercase transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]"
                        >
                            Save Changes
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Name */}
                <div className="p-4 bg-white dark:bg-gray-800 border-2 border-black dark:border-white">
                    <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-widest mb-2 block">Primary Contact Name</label>
                    {isEditing ? (
                        <input
                            type="text"
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border-2 border-black dark:border-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                    ) : (
                        <p className="text-base font-black text-black dark:text-white">{contactName || "—"}</p>
                    )}
                </div>

                {/* Email */}
                <div className="p-4 bg-white dark:bg-gray-800 border-2 border-black dark:border-white">
                    <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-widest mb-2 block">Email Address</label>
                    {isEditing ? (
                        <input
                            type="email"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border-2 border-black dark:border-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                    ) : (
                        <a
                            href={`mailto:${contactEmail}`}
                            className="text-base font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-2"
                        >
                            <Mail size={16} />
                            {contactEmail || "—"}
                        </a>
                    )}
                </div>

                {/* Phone */}
                <div className="p-4 bg-white dark:bg-gray-800 border-2 border-black dark:border-white">
                    <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 tracking-widest mb-2 block">Phone Number</label>
                    {isEditing ? (
                        <input
                            type="tel"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border-2 border-black dark:border-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                    ) : (
                        <a
                            href={`tel:${contactPhone}`}
                            className="text-base font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-2 font-mono"
                        >
                            <Phone size={16} />
                            {contactPhone || "—"}
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
