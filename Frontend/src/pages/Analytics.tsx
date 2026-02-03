import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HistoryChart } from '@/components/dashboard/HistoryChart';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { AnalyticsNavBar } from '@/components/dashboard/AnalyticsNavBar';
import {
    getHeatmapData,
    getDashboardHistory,
    type CustomerAccount,
    type HistoryData
} from '@/lib/api';

export default function Analytics() {
    const [activeTab, setActiveTab] = useState('overview');
    const [heatmapData, setHeatmapData] = useState<CustomerAccount[]>([]);
    const [historyData, setHistoryData] = useState<HistoryData[]>([]);
    const [historyRange, setHistoryRange] = useState('12m');
    const [isLoading, setIsLoading] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [heatmap, history] = await Promise.all([
                getHeatmapData(),
                getDashboardHistory(historyRange),
            ]);
            setHeatmapData(heatmap);
            setHistoryData(history);
        } catch (error) {
            console.error('Failed to fetch analytics data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [historyRange]);

    const handleRangeChange = (range: string) => {
        setHistoryRange(range);
    };

    return (
        <div className="px-4 pb-4 pt-2 max-w-[1600px] mx-auto h-[calc(100vh-64px)] flex flex-col gap-4">
            {/* NBA Style Header */}
            <div className="shrink-0">
                <AnalyticsNavBar activeTab={activeTab} onTabChange={setActiveTab} />
            </div>

            {/* Main Grid - Side by Side */}
            <div className="grid grid-cols-12 gap-4 flex-1 min-h-0 pb-2">
                {/* Performance DNA (Left - 4 Cols) */}
                <div className="col-span-12 lg:col-span-4 border-2 border-black bg-white overflow-hidden flex flex-col shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <PerformanceChart data={historyData} />
                </div>

                {/* Trend Analysis (Right - 8 Cols) */}
                <div className="col-span-12 lg:col-span-8 border-2 border-black bg-white overflow-hidden flex flex-col shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <HistoryChart
                        data={historyData}
                        selectedRange={historyRange}
                        onRangeChange={handleRangeChange}
                    />
                </div>
            </div>
        </div>
    );
}
