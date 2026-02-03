import {
    ComposedChart,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { HistoryData } from '@/lib/api';
import { motion } from 'framer-motion';

interface HistoryChartProps {
    data: HistoryData[];
    selectedRange: string;
    onRangeChange: (range: string) => void;
}

export function HistoryChart({ data, selectedRange, onRangeChange }: HistoryChartProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6 rounded-2xl border border-border/50"
        >
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">Performance History</h3>
                <select
                    value={selectedRange}
                    onChange={(e) => onRangeChange(e.target.value)}
                    className="bg-secondary text-foreground text-sm rounded-lg p-2 border border-border focus:ring-2 focus:ring-primary outline-none"
                >
                    <option value="3m">Last 3 Months</option>
                    <option value="6m">Last 6 Months</option>
                    <option value="12m">Last 12 Months</option>
                    <option value="5y">Last 5 Years</option>
                    <option value="all">All Time</option>
                </select>
            </div>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={data}
                        margin={{
                            top: 20,
                            right: 20,
                            bottom: 20,
                            left: 20,
                        }}
                    >
                        <CartesianGrid stroke="#333" strokeDasharray="3 3" vertical={false} opacity={0.3} />
                        <XAxis
                            dataKey="month"
                            stroke="#888"
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                        />
                        <YAxis
                            yAxisId="left"
                            stroke="#888"
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#888"
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value / 1000}k`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1e1e2e',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                color: '#fff'
                            }}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="renewals" name="Renewals" fill="#4ade80" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        <Bar yAxisId="left" dataKey="churned" name="Churned" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="upsell_revenue"
                            name="Upsell Revenue"
                            stroke="#60a5fa"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#1e1e2e', strokeWidth: 2 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}
