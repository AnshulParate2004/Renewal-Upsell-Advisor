import { useMemo } from 'react';
import { CustomerAccount } from '@/lib/api';
import { motion } from 'framer-motion';

interface RegionalMapProps {
    accounts: CustomerAccount[];
}

// Simple US Map SVG Path (Simplified for visual reference)
// A rectangle or simplified shape will represent the map for this demo if a full complex Path is too large.
// Using a stylized 'Abstract Map' approach to fit the UI theme.

export function RegionalMap({ accounts }: RegionalMapProps) {
    // Simulate Regions based on Account ID hash
    const regionData = useMemo(() => {
        const regions = { East: 0, West: 0, Central: 0, South: 0 };

        accounts.forEach(acc => {
            // Simple hash to assign region
            const hash = acc.account_id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
            const val = hash % 4;
            if (val === 0) regions.East += acc.arr;
            else if (val === 1) regions.West += acc.arr;
            else if (val === 2) regions.Central += acc.arr;
            else regions.South += acc.arr;
        });

        return regions;
    }, [accounts]);

    const maxVal = Math.max(...Object.values(regionData));

    // Helper for bubble sizing
    const getBubbleSize = (val: number) => {
        if (maxVal === 0) return 30;
        return (val / maxVal) * 40 + 30; // Min size 30px, Max additional 40px (Total max 70px) - Ultracompact
    };

    return (
        <div className="bg-white border-2 border-black/10 w-full h-full p-4 flex flex-col relative overflow-hidden shadow-sm">
            <div className="flex justify-between items-center mb-1 z-10 border-b-2 border-black/5 pb-1">
                <h3 className="text-sm font-black uppercase tracking-wider text-black">Regional Revenue Distribution</h3>
                <span className="text-[10px] font-bold text-black/60 bg-black/5 px-2 py-0.5 rounded">Simulated Geography</span>
            </div>

            <div className="flex-1 relative w-full h-full">
                {/* Background & Connecting Lines */}
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full absolute inset-0 pointer-events-none">
                    {/* Simulated US Map Background */}
                    <path d="M 5,20 L 25,10 L 50,5 L 95,15 L 90,80 L 70,95 L 20,85 L 5,50 Z"
                        fill="black" fillOpacity="0.03" />

                    {/* Connecting Lines (Network Effect) - Flattened */}
                    <path d="M 15,50 L 38,40" stroke="black" strokeWidth="0.5" strokeOpacity="0.2" strokeDasharray="2 2" /> {/* West -> Central */}
                    <path d="M 38,40 L 85,50" stroke="black" strokeWidth="0.5" strokeOpacity="0.2" strokeDasharray="2 2" /> {/* Central -> East */}
                    <path d="M 38,40 L 62,60" stroke="black" strokeWidth="0.5" strokeOpacity="0.2" strokeDasharray="2 2" /> {/* Central -> South */}
                    <path d="M 62,60 L 85,50" stroke="black" strokeWidth="0.5" strokeOpacity="0.2" strokeDasharray="2 2" /> {/* South -> East */}
                    <path d="M 15,50 L 62,60" stroke="black" strokeWidth="0.5" strokeOpacity="0.2" strokeDasharray="2 2" /> {/* West -> South */}
                </svg>

                {/* West - Left Center */}
                <div className="absolute left-[15%] top-[50%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex flex-col items-center group cursor-pointer"
                    >
                        <div
                            className="rounded-full bg-white border-[3px] border-blue-600 flex items-center justify-center shadow-md transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl z-20 relative"
                            style={{ width: `${getBubbleSize(regionData.West)}px`, height: `${getBubbleSize(regionData.West)}px` }}
                        >
                            <span className="text-[9px] font-extrabold text-blue-900 uppercase tracking-tighter">West</span>
                        </div>
                        <div className="mt-1 bg-white border border-blue-200 text-blue-900 text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm z-30 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            ${(regionData.West / 1000).toFixed(0)}K
                        </div>
                    </motion.div>
                </div>

                {/* Central - Mid-Left Upper (Flattened to 40%) */}
                <div className="absolute left-[38%] top-[40%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="flex flex-col items-center group cursor-pointer"
                    >
                        <div
                            className="rounded-full bg-white border-[3px] border-purple-600 flex items-center justify-center shadow-md transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl z-20 relative"
                            style={{ width: `${getBubbleSize(regionData.Central)}px`, height: `${getBubbleSize(regionData.Central)}px` }}
                        >
                            <span className="text-[9px] font-extrabold text-purple-900 uppercase tracking-tighter">Central</span>
                        </div>
                        <div className="mt-1 bg-white border border-purple-200 text-purple-900 text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm z-30 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            ${(regionData.Central / 1000).toFixed(0)}K
                        </div>
                    </motion.div>
                </div>

                {/* South - Mid-Right Lower (Flattened to 60%) */}
                <div className="absolute left-[62%] top-[60%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col items-center group cursor-pointer"
                    >
                        <div
                            className="rounded-full bg-white border-[3px] border-orange-600 flex items-center justify-center shadow-md transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl z-20 relative"
                            style={{ width: `${getBubbleSize(regionData.South)}px`, height: `${getBubbleSize(regionData.South)}px` }}
                        >
                            <span className="text-[9px] font-extrabold text-orange-900 uppercase tracking-tighter">South</span>
                        </div>
                        <div className="mt-1 bg-white border border-orange-200 text-orange-900 text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm z-30 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                            ${(regionData.South / 1000).toFixed(0)}K
                        </div>
                    </motion.div>
                </div>

                {/* East - Right Center */}
                <div className="absolute left-[85%] top-[50%] transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col items-center group cursor-pointer"
                    >
                        <div
                            className="rounded-full bg-white border-[3px] border-emerald-600 flex items-center justify-center shadow-md transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl z-20 relative"
                            style={{ width: `${getBubbleSize(regionData.East)}px`, height: `${getBubbleSize(regionData.East)}px` }}
                        >
                            <span className="text-[9px] font-extrabold text-emerald-900 uppercase tracking-tighter">East</span>
                        </div>
                        <div className="mt-1 bg-white border border-emerald-200 text-emerald-900 text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm z-30 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            ${(regionData.East / 1000).toFixed(0)}K
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
