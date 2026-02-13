import { AccountActivity } from '@/data/mockData';
import { Phone, Mail, Users, Ticket, FileEdit, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useState } from 'react';

interface ActivityTimelineProps {
    activities: AccountActivity[];
}

export default function ActivityTimeline({ activities }: ActivityTimelineProps) {
    const [filter, setFilter] = useState<string>('all');

    const getIcon = (type: AccountActivity['type']) => {
        switch (type) {
            case 'call': return <Phone size={16} />;
            case 'email': return <Mail size={16} />;
            case 'meeting': return <Users size={16} />;
            case 'support_ticket': return <Ticket size={16} />;
            case 'contract_change': return <FileEdit size={16} />;
            case 'usage_spike': return <TrendingUp size={16} />;
            case 'usage_drop': return <TrendingDown size={16} />;
            case 'payment': return <DollarSign size={16} />;
            default: return <Mail size={16} />;
        }
    };

    const getTypeColor = (type: AccountActivity['type']) => {
        switch (type) {
            case 'call': return 'bg-blue-600';
            case 'email': return 'bg-purple-600';
            case 'meeting': return 'bg-indigo-600';
            case 'support_ticket': return 'bg-orange-600';
            case 'contract_change': return 'bg-green-600';
            case 'usage_spike': return 'bg-emerald-600';
            case 'usage_drop': return 'bg-red-600';
            case 'payment': return 'bg-teal-600';
            default: return 'bg-gray-600';
        }
    };

    const getSentimentBadge = (sentiment?: 'positive' | 'neutral' | 'negative') => {
        if (!sentiment) return null;
        const colors = {
            positive: 'bg-green-600 text-white',
            neutral: 'bg-gray-400 text-black',
            negative: 'bg-red-600 text-white'
        };
        return (
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 border-2 border-black ${colors[sentiment]} shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]`}>
                {sentiment}
            </span>
        );
    };

    const filteredActivities = filter === 'all'
        ? activities
        : activities.filter(a => a.type === filter);

    const activityTypes = ['all', 'call', 'email', 'meeting', 'support_ticket', 'contract_change', 'usage_spike', 'usage_drop', 'payment'];

    return (
        <div className="w-full">
            {/* Filter Buttons */}
            <div className="mb-4 flex flex-wrap gap-2">
                {activityTypes.map(type => (
                    <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className={`text-[10px] font-black uppercase px-3 py-1.5 border-2 border-black transition-all ${filter === type
                                ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                : 'bg-white text-black hover:bg-gray-100 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                            }`}
                    >
                        {type.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* Timeline */}
            <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-black/20 dark:bg-white/20" />

                {/* Activities */}
                <div className="space-y-4">
                    {filteredActivities.map((activity, idx) => (
                        <div key={activity.id} className="relative pl-14">
                            {/* Icon */}
                            <div className={`absolute left-0 top-1 w-12 h-12 ${getTypeColor(activity.type)} border-2 border-black dark:border-white flex items-center justify-center text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]`}>
                                {getIcon(activity.type)}
                            </div>

                            {/* Content Card */}
                            <div className="bg-white dark:bg-gray-800 border-2 border-black dark:border-white p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]">
                                <div className="flex items-start justify-between mb-1">
                                    <h4 className="font-black text-sm text-black dark:text-white">{activity.title}</h4>
                                    {getSentimentBadge(activity.sentiment)}
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{activity.description}</p>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 dark:text-gray-500">
                                    <span className="uppercase">{activity.type.replace('_', ' ')}</span>
                                    <span>•</span>
                                    <span>{new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {filteredActivities.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 font-bold">
                    No activities found for this filter
                </div>
            )}
        </div>
    );
}
