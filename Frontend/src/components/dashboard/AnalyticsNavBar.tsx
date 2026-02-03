import { motion } from 'framer-motion';

interface AnalyticsNavBarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export function AnalyticsNavBar({ activeTab, onTabChange }: AnalyticsNavBarProps) {
    const tabs = [
        { id: 'overview', label: 'Market Overview' },
        { id: 'regional', label: 'Regional Analysis' }, // Replaces "East vs West"
        { id: 'performance', label: 'Performance DNA' },
        { id: 'trends', label: 'Trend Analysis' },
    ];

    return (
        <div className="flex flex-col w-full bg-white border border-black/80">
            {/* Tab Row - High Contrast NBA Style */}
            <div className="flex items-stretch border-b border-black/80 divide-x divide-black/80">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`
                                flex-1 py-1 text-sm font-bold uppercase tracking-wider transition-colors
                                ${isActive
                                    ? 'bg-black text-white'
                                    : 'bg-white text-black hover:bg-gray-100'
                                }
                            `}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>
            {/* Metric Pills Row - REMOVED */}
        </div>
    );
}
