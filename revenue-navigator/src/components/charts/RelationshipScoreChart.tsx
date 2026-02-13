import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { accounts } from '@/data/mockData';
import { BarChart3 } from 'lucide-react';

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
                <div className="bg-white p-3 border-2 border-foreground rounded-lg" style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }}>
                    <p className="text-xs font-black uppercase text-foreground mb-1">{label} 2025/2026</p>
                    <p className="text-sm font-black text-primary uppercase">
                        Avg Score: {payload[0].value}%
                    </p>
                    <p className="text-xs font-black text-foreground/60 uppercase tracking-wider">
                        Across {accounts.length} accounts
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="paper-card h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-accent" />
                    <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                            AVERAGE RELATIONSHIP SCORE TREND
                        </h3>
                        <p className="text-[10px] font-black text-foreground/60 uppercase tracking-wider mt-1">
                            Portfolio-wide average across all {accounts.length} accounts
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-black font-mono text-primary">{currentAvg}%</div>
                    <div className={`text-xs font-black uppercase tracking-wider ${trendDirection === 'up' ? 'text-success' : 'text-destructive'}`}>
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
            <div className="mt-3 pt-3 border-t-2 border-foreground/20">
                <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-3 bg-white border-2 border-primary rounded-lg" style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }}>
                        <p className="font-black text-primary uppercase tracking-wider text-[10px] mb-1">Current Avg</p>
                        <p className="text-lg font-black font-mono text-foreground">{currentAvg}%</p>
                    </div>
                    <div className={`p-3 bg-white border-2 rounded-lg ${trendDirection === 'up' ? 'border-success' : 'border-destructive'}`} style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }}>
                        <div className="flex items-center gap-1 mb-1">
                            <BarChart3 className={`h-3 w-3 ${trendDirection === 'up' ? 'text-success' : 'text-destructive'}`} />
                            <p className={`font-black uppercase tracking-wider text-[10px] ${trendDirection === 'up' ? 'text-success' : 'text-destructive'}`}>
                                Trend
                            </p>
                        </div>
                        <p className="text-lg font-black font-mono text-foreground">
                            {trendDirection === 'up' ? '+' : '-'}{trendChange}%
                        </p>
                    </div>
                    <div className="p-3 bg-white border-2 border-accent rounded-lg" style={{ boxShadow: "1px 1px 0px 0px hsl(var(--foreground))" }}>
                        <p className="font-black text-accent uppercase tracking-wider text-[10px] mb-1">Total Accounts</p>
                        <p className="text-lg font-black font-mono text-foreground">{accounts.length}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
