import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { HistoryData } from '@/lib/api';
import { motion } from 'framer-motion';

interface PerformanceChartProps {
    data: HistoryData[];
}

export function PerformanceChart({ data }: PerformanceChartProps) {
    // Transform data for Radar Chart (Comparison View)
    const recent = data[data.length - 1] || { renewals: 0, churned: 0, upsell_revenue: 0 };

    const radarData = [
        { subject: 'Renewals', A: recent.renewals || 0, B: 20, fullMark: 50 },
        { subject: 'Churn', A: recent.churned || 0, B: 2, fullMark: 10 },
        { subject: 'Upsell', A: (recent.upsell_revenue || 0) / 1000, B: 30, fullMark: 100 },
        { subject: 'NPS', A: 75, B: 60, fullMark: 100 },
        { subject: 'Engagement', A: 85, B: 70, fullMark: 100 },
        { subject: 'Adoption', A: 65, B: 90, fullMark: 100 },
    ];

    return (
        <div className="flex flex-col h-full bg-white border-2 border-black/10 shadow-sm overflow-hidden relative">
            <div className="p-3 border-b-2 border-black/5 bg-white flex justify-between items-center">
                <h3 className="text-sm font-black uppercase tracking-wider text-black">Performance DNA</h3>
            </div>

            <div className="flex-1 w-full min-h-0 relative p-2">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                        <PolarGrid stroke="#000" strokeOpacity={0.2} />
                        <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fontSize: 11, fill: '#000', fontWeight: 'bold' }}
                            stroke="#000"
                        />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar
                            name="Current"
                            dataKey="A"
                            stroke="#2563eb"
                            strokeWidth={3}
                            fill="#2563eb"
                            fillOpacity={0.3}
                        />
                        <Radar
                            name="Target"
                            dataKey="B"
                            stroke="#94a3b8"
                            strokeWidth={2}
                            fill="#94a3b8"
                            fillOpacity={0.1}
                            strokeDasharray="4 4"
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', marginTop: '10px' }} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            {/* KPI Footer - Chips Style */}
            <div className="p-3 bg-gray-50/50 border-t-2 border-black/5 flex justify-center gap-3">
                <div className="bg-white border-2 border-black px-3 py-1 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="text-[9px] text-black/60 uppercase font-bold tracking-widest">Efficiency</div>
                    <div className="text-sm font-black font-mono text-black">94%</div>
                </div>
                <div className="bg-white border-2 border-black px-3 py-1 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <div className="text-[9px] text-black/60 uppercase font-bold tracking-widest">Volume</div>
                    <div className="text-sm font-black font-mono text-blue-600">High</div>
                </div>
            </div>
        </div>
    );
}
