import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { accounts } from '@/data/mockData';

export default function RelationshipTrendChart() {
    // Generate 6 months of historical data for average relationship score
    const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];

    // Calculate current average
    const currentAvg = Math.round(
        accounts.reduce((sum, acc) => sum + acc.relationshipScore, 0) / accounts.length
    );

    // Generate trend data showing average across all accounts
    const trendData = months.map((month, monthIndex) => {
        // Simulate historical average with slight variation
        const variation = (Math.random() - 0.5) * 5;
        const trend = currentAvg >= 60 ? 1 : -1;
        const historicalAvg = Math.max(40, Math.min(100,
            currentAvg - (5 - monthIndex) * 2 * trend + variation
        ));

        return {
            month,
            average: Math.round(historicalAvg),
            // Also track high and low for context
            high: Math.min(100, Math.round(historicalAvg + 15)),
            low: Math.max(20, Math.round(historicalAvg - 15))
        };
    });

    // Calculate trend direction
    const firstMonth = trendData[0].average;
    const lastMonth = trendData[trendData.length - 1].average;
    const trendDirection = lastMonth > firstMonth ? 'up' : 'down';
    const trendChange = Math.abs(lastMonth - firstMonth);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-800 p-3 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-xs font-black uppercase text-black dark:text-white mb-1">{label} 2025/2026</p>
                    <p className="text-sm font-bold text-purple-600">
                        Avg Score: {payload[0].value}%
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        Across {accounts.length} accounts
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white dark:bg-gray-800 border-2 border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
                        📈 Average Relationship Score Trend
                    </h3>
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 mt-1">
                        Portfolio-wide average across all {accounts.length} accounts
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-black font-mono text-purple-600">{currentAvg}%</div>
                    <div className={`text-xs font-bold ${trendDirection === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                        {trendDirection === 'up' ? '↗' : '↘'} {trendChange}% vs 6mo ago
                    </div>
                </div>
            </div>

            <div className="flex-1 h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <defs>
                            <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                            dataKey="month"
                            stroke="#6b7280"
                            style={{ fontSize: '11px', fontWeight: 'bold' }}
                        />
                        <YAxis
                            domain={[0, 100]}
                            stroke="#6b7280"
                            style={{ fontSize: '11px', fontWeight: 'bold' }}
                            label={{ value: 'Avg Score %', angle: -90, position: 'insideLeft', style: { fontSize: '10px', fontWeight: 'bold' } }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="average"
                            stroke="#a855f7"
                            strokeWidth={3}
                            fill="url(#colorAvg)"
                            dot={{ fill: '#a855f7', r: 4, strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Insight Summary */}
            <div className="mt-3 pt-3 border-t-2 border-black/10 dark:border-white/10">
                <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 bg-purple-50 dark:bg-purple-950/30 border border-purple-600 rounded">
                        <p className="font-black text-purple-700 dark:text-purple-400">Current Avg</p>
                        <p className="text-lg font-black font-mono text-black dark:text-white">{currentAvg}%</p>
                    </div>
                    <div className={`p-2 border rounded ${trendDirection === 'up' ? 'bg-green-50 dark:bg-green-950/30 border-green-600' : 'bg-red-50 dark:bg-red-950/30 border-red-600'}`}>
                        <p className={`font-black ${trendDirection === 'up' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                            {trendDirection === 'up' ? '📈 Trend' : '📉 Trend'}
                        </p>
                        <p className="text-lg font-black font-mono text-black dark:text-white">
                            {trendDirection === 'up' ? '+' : '-'}{trendChange}%
                        </p>
                    </div>
                    <div className="p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-600 rounded">
                        <p className="font-black text-blue-700 dark:text-blue-400">Total Accounts</p>
                        <p className="text-lg font-black font-mono text-black dark:text-white">{accounts.length}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
