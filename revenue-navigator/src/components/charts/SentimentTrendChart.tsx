import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { SentimentHistory } from '@/data/mockData';

interface SentimentTrendChartProps {
    data: SentimentHistory[];
}

export default function SentimentTrendChart({ data }: SentimentTrendChartProps) {
    // Sort by date and format for chart
    const chartData = [...data]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(d => ({
            date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            score: d.score,
            source: d.source,
            summary: d.summary
        }));

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white dark:bg-gray-800 p-3 border-[0.5px] border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <p className="text-xs font-black uppercase">{data.date}</p>
                    <p className={`text-sm font-bold ${data.score > 0.5 ? 'text-emerald-600' : data.score > 0 ? 'text-blue-600' : data.score > -0.5 ? 'text-yellow-600' : 'text-red-600'}`}>
                        Score: {data.score > 0 ? '+' : ''}{data.score.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{data.source.replace('_', ' ')}</p>
                    {data.summary && <p className="text-xs mt-1 text-gray-700 dark:text-gray-300">{data.summary}</p>}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-[350px] bg-white dark:bg-gray-800 p-4 border-[0.5px] border-black dark:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]">
            <h3 className="text-sm font-black uppercase mb-4 text-black dark:text-white">💭 Sentiment Analysis Trend</h3>
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
                        domain={[-1, 1]}
                        ticks={[-1, -0.5, 0, 0.5, 1]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {/* Reference lines for sentiment zones */}
                    <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
                    <ReferenceLine y={0.5} stroke="#10b981" strokeDasharray="2 2" strokeOpacity={0.3} />
                    <ReferenceLine y={-0.5} stroke="#ef4444" strokeDasharray="2 2" strokeOpacity={0.3} />
                    <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        dot={{ fill: '#8b5cf6', r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2 text-xs font-bold">
                <span className="text-emerald-600">● Positive (&gt;0.5)</span>
                <span className="text-blue-600">● Neutral (0 to 0.5)</span>
                <span className="text-yellow-600">● Slight Negative (-0.5 to 0)</span>
                <span className="text-red-600">● Negative (&lt;-0.5)</span>
            </div>
        </div>
    );
}
