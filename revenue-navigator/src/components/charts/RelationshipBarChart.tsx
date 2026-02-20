import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { useAccounts } from '@/hooks/useAccounts';

export default function RelationshipBarChart() {
    const { data: accounts = [], isLoading } = useAccounts();
    
    // Prepare data for the chart
    const chartData = accounts
        .sort((a, b) => b.relationshipScore - a.relationshipScore)
        .slice(0, 12) // Show top 12 accounts
        .map(account => ({
            name: account.name.length > 20 ? account.name.substring(0, 20) + '...' : account.name,
            score: account.relationshipScore,
            fullName: account.name
        }));

    // Color based on score
    const getColor = (score: number) => {
        if (score >= 70) return '#3b82f6'; // Blue - Strong
        if (score >= 50) return '#a855f7'; // Purple - Good
        if (score >= 30) return '#f59e0b'; // Orange - Fair
        return '#ef4444'; // Red - Weak
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-800 p-3 border-[0.5px] border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-xs font-black uppercase text-black dark:text-white">{payload[0].payload.fullName}</p>
                    <p className="text-sm font-bold" style={{ color: getColor(payload[0].value) }}>
                        Relationship Score: {payload[0].value}%
                    </p>
                </div>
            );
        }
        return null;
    };

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-800 border-[0.5px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] p-4 h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-xs text-foreground/60">Loading chart data...</p>
                </div>
            </div>
        );
    }

    if (chartData.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 border-[0.5px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] p-4 h-full flex items-center justify-center">
                <p className="text-sm text-foreground/60">No account data available</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 border-[0.5px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
                    💜 Top Customer Relationship Scores
                </h3>
                <span className="text-[10px] font-bold uppercase text-muted-foreground bg-muted/10 px-2 py-1 rounded border-[0.5px] border-black">
                    Top 12 Accounts
                </span>
            </div>

            <div className="flex-1 h-96">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                            type="number"
                            domain={[0, 100]}
                            stroke="#6b7280"
                            style={{ fontSize: '10px', fontWeight: 'bold' }}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            stroke="#6b7280"
                            style={{ fontSize: '10px', fontWeight: 'bold' }}
                            width={95}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getColor(entry.score)} />
                            ))}
                            <LabelList
                                dataKey="score"
                                position="right"
                                formatter={(value: number) => `${value}%`}
                                style={{ fill: '#fff', fontWeight: 'bold', fontSize: '11px' }}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-3 text-xs font-bold justify-center flex-wrap">
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-blue-600 border-[0.5px] border-black"></span>
                    Strong (70%+)
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-purple-600 border-[0.5px] border-black"></span>
                    Good (50-69%)
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-orange-500 border-[0.5px] border-black"></span>
                    Fair (30-49%)
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-red-600 border-[0.5px] border-black"></span>
                    Weak (&lt;30%)
                </span>
            </div>
        </div>
    );
}
