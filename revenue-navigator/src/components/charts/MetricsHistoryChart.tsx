import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MetricsHistory } from '@/data/mockData';

interface MetricsHistoryChartProps {
    data: MetricsHistory[];
}

export default function MetricsHistoryChart({ data }: MetricsHistoryChartProps) {
    // Format data for the chart
    const chartData = data.map(d => ({
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        'Health Score': d.healthScore,
        'Risk Score': d.riskScore,
        'Relationship': d.relationshipScore,
        'Churn Risk': Math.round(d.churnProbability * 100),
        'Utilization': d.utilization
    }));

    return (
        <div className="w-full h-[400px] bg-white dark:bg-gray-800 p-4 border-[0.5px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]">
            <h3 className="text-sm font-black uppercase mb-4 text-black dark:text-white">📊 Metrics History (6 Months)</h3>
            <ResponsiveContainer width="100%" height="90%">
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="date"
                        stroke="#6b7280"
                        style={{ fontSize: '10px', fontWeight: 'bold' }}
                    />
                    <YAxis
                        stroke="#6b7280"
                        style={{ fontSize: '10px', fontWeight: 'bold' }}
                        domain={[0, 100]}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            border: '0.5px solid #000',
                            borderRadius: '0',
                            boxShadow: '2px 2px 0px 0px rgba(0,0,0,1)',
                            fontSize: '11px',
                            fontWeight: 'bold'
                        }}
                    />
                    <Legend
                        wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="Health Score"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: '#10b981', r: 3 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="Risk Score"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ fill: '#ef4444', r: 3 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="Relationship"
                        stroke="#a855f7"
                        strokeWidth={2}
                        dot={{ fill: '#a855f7', r: 3 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="Churn Risk"
                        stroke="#f97316"
                        strokeWidth={2}
                        dot={{ fill: '#f97316', r: 3 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="Utilization"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 3 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
