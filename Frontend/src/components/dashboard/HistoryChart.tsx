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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col h-full bg-white border-2 border-black/10 shadow-sm"
        >
            <div className="p-3 border-b-2 border-black/5 bg-white flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-wider text-black">Trend Analysis</h3>
                <div className="relative">
                    <select
                        value={selectedRange}
                        onChange={(e) => onRangeChange(e.target.value)}
                        className="appearance-none bg-white text-black text-[10px] font-bold uppercase rounded-none border-2 border-black px-3 py-1 outline-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer w-20 text-center"
                    >
                        <option value="3m">3 Months</option>
                        <option value="6m">6 Months</option>
                        <option value="12m">1 Year</option>
                        <option value="5y">5 Years</option>
                        <option value="all">Max</option>
                    </select>
                </div>
            </div>

            <div className="flex-1 w-full min-h-0 relative p-4">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={data}
                        margin={{ top: 10, right: 0, bottom: 0, left: -20 }}
                    >
                        <CartesianGrid stroke="#000" strokeOpacity={0.05} strokeDasharray="4 4" vertical={false} />
                        <XAxis
                            dataKey="month"
                            stroke="#000"
                            tick={{ fontSize: 10, fill: '#000', fontWeight: 'bold' }}
                            tickLine={false}
                            axisLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            yAxisId="left"
                            stroke="#000"
                            tick={{ fontSize: 10, fill: '#666' }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#000"
                            tick={{ fontSize: 10, fill: '#666' }}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#000',
                                border: 'none',
                                fontSize: '11px',
                                borderRadius: '0px',
                                color: '#fff',
                                boxShadow: '4px 4px 0px 0px rgba(0,0,0,0.2)'
                            }}
                            cursor={{ fill: '#000', opacity: 0.05 }}
                            itemStyle={{ padding: 0 }}
                            labelStyle={{ marginBottom: '4px', fontWeight: 'bold', color: '#fff' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px', fontWeight: 'bold' }} />
                        <Bar yAxisId="left" dataKey="renewals" name="Renewals" fill="#000" barSize={12} radius={[0, 0, 0, 0]} />
                        <Bar yAxisId="left" dataKey="churned" name="Churned" fill="#ef4444" barSize={12} radius={[0, 0, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="upsell_revenue" name="Revenue" stroke="#2563eb" strokeWidth={3} dot={{ r: 3, fill: '#2563eb', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}
