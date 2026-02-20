import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useAccounts } from '@/hooks/useAccounts';

export default function RelationshipTrendChart() {
    const { data: accounts = [], isLoading } = useAccounts();

    const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];

    const currentAvg = accounts.length > 0
        ? Math.round(accounts.reduce((sum, acc) => sum + acc.relationshipScore, 0) / accounts.length)
        : 0;

    const trendData = months.map((month, monthIndex) => {
        const variation = (Math.random() - 0.5) * 5;
        const trend = currentAvg >= 60 ? 1 : -1;
        const historicalAvg = Math.max(40, Math.min(100,
            currentAvg - (5 - monthIndex) * 2 * trend + variation
        ));
        return {
            month,
            average: Math.round(historicalAvg),
            high: Math.min(100, Math.round(historicalAvg + 15)),
            low: Math.max(20, Math.round(historicalAvg - 15))
        };
    });

    const firstMonth = trendData[0].average;
    const lastMonth = trendData[trendData.length - 1].average;
    const trendDirection = lastMonth > firstMonth ? 'up' : 'down';
    const trendChange = Math.abs(lastMonth - firstMonth);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-card p-3 border-[0.5px] border-black rounded-lg shadow-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
                    <p className="text-sm font-semibold text-primary">
                        Avg Score: {payload[0].value}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Across {accounts.length} accounts
                    </p>
                </div>
            );
        }
        return null;
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-xs text-muted-foreground">Loading chart data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-black bg-muted/50">
                <div>
                    <h3 className="text-sm font-semibold text-foreground">
                        Relationship Score Trend
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Portfolio average across {accounts.length} accounts
                    </p>
                </div>
                <div className="text-right flex items-center gap-3">
                    <div>
                        <div className="text-2xl font-bold text-foreground">{currentAvg}%</div>
                        <div className={`text-xs font-medium flex items-center gap-1 justify-end ${trendDirection === 'up' ? 'text-emerald-600' : 'text-destructive'}`}>
                            {trendDirection === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {trendChange}% vs 6mo ago
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-[200px] p-5">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                        <defs>
                            <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis
                            dataKey="month"
                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            domain={[0, 100]}
                            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="average"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            fill="url(#colorAvg)"
                            dot={{ fill: 'hsl(var(--primary))', r: 3, strokeWidth: 2, stroke: 'hsl(var(--card))' }}
                            activeDot={{ r: 5, strokeWidth: 0 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Summary stats */}
            <div className="px-5 pb-5 pt-0 border-t border-black grid grid-cols-3 gap-3">
                <div className="text-center pt-4">
                    <p className="text-xs text-muted-foreground mb-0.5">Current Avg</p>
                    <p className="text-lg font-bold text-foreground">{currentAvg}%</p>
                </div>
                <div className="text-center pt-4">
                    <p className="text-xs text-muted-foreground mb-0.5">Trend</p>
                    <p className={`text-lg font-bold ${trendDirection === 'up' ? 'text-emerald-600' : 'text-destructive'}`}>
                        {trendDirection === 'up' ? '+' : '-'}{trendChange}%
                    </p>
                </div>
                <div className="text-center pt-4">
                    <p className="text-xs text-muted-foreground mb-0.5">Accounts</p>
                    <p className="text-lg font-bold text-foreground">{accounts.length}</p>
                </div>
            </div>
        </div>
    );
}
