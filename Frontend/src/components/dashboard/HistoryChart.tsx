import {
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar
} from 'recharts';
import { HistoryData } from '@/lib/api';
import { motion } from 'framer-motion';

interface HistoryChartProps {
    data: HistoryData[];
    selectedRange: string;
    onRangeChange: (range: string) => void;
}

export function HistoryChart({ data, selectedRange, onRangeChange }: HistoryChartProps) {
    // Transform data for Radar Chart (Comparison View)
    // Taking the last month and average of last 3 months for mock comparison
    const recent = data[data.length - 1] || { renewals: 0, churned: 0, upsell_revenue: 0 };
    const radarData = [
        { subject: 'Renewals', A: recent.renewals, B: 20, fullMark: 50 },
        { subject: 'Churn', A: recent.churned, B: 2, fullMark: 10 },
        { subject: 'Upsell (k)', A: recent.upsell_revenue / 1000, B: 30, fullMark: 100 },
        { subject: 'NPS', A: 75, B: 60, fullMark: 100 },
        { subject: 'Engagement', A: 85, B: 70, fullMark: 100 },
        { subject: 'Adoption', A: 65, B: 90, fullMark: 100 },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-0 h-full bg-background"
        >
            {/* Left Panel: Time Series (2/3 width) */}
            <div className="lg:col-span-2 p-4 border-r border-border flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Trend Analysis</h3>
                    <select
                        value={selectedRange}
                        onChange={(e) => onRangeChange(e.target.value)}
                        className="bg-secondary text-foreground text-xs font-mono rounded px-2 py-1 border border-border outline-none"
                    >
                        <option value="3m">3M</option>
                        <option value="6m">6M</option>
                        <option value="12m">1Y</option>
                        <option value="5y">5Y</option>
                        <option value="all">ALL</option>
                    </select>
                </div>
                <div className="flex-1 w-full min-h-0 relative">
                    <div className="absolute inset-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                                data={data}
                                margin={{ top: 10, right: 10, bottom: 0, left: 0 }}
                            >
                                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="month"
                                    stroke="#6b7280"
                                    tick={{ fontSize: 10 }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    yAxisId="left"
                                    stroke="#6b7280"
                                    tick={{ fontSize: 10 }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    stroke="#6b7280"
                                    tick={{ fontSize: 10 }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value / 1000}k`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#fff',
                                        border: '1px solid #e5e7eb',
                                        fontSize: '12px',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                />
                                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                <Bar yAxisId="left" dataKey="renewals" name="Renewals" fill="#0f172a" barSize={20} />
                                <Bar yAxisId="left" dataKey="churned" name="Churned" fill="#ef4444" barSize={20} />
                                <Line yAxisId="right" type="linear" dataKey="upsell_revenue" name="Revenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Right Panel: Radar Chart (1/3 width) */}
            <div className="p-4 bg-muted/5 flex flex-col h-full">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Performance DNA</h3>
                <div className="flex-1 w-full min-h-0 relative">
                    <div className="absolute inset-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="#e5e7eb" />
                                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name="Current" dataKey="A" stroke="#0f172a" fill="#0f172a" fillOpacity={0.3} />
                                <Radar name="Target" dataKey="B" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.1} />
                                <Legend wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="text-center p-2 border border-border bg-white rounded">
                            <div className="text-[10px] text-muted-foreground uppercase">Efficiency</div>
                            <div className="text-lg font-bold font-mono">94%</div>
                        </div>
                        <div className="text-center p-2 border border-border bg-white rounded">
                            <div className="text-[10px] text-muted-foreground uppercase">Volume</div>
                            <div className="text-lg font-bold font-mono text-primary">High</div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
