import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Zap, BrainCircuit, BarChart3, Lock } from 'lucide-react';

export default function Landing() {
    const navigate = useNavigate();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-blue-100">
            {/* Navigation */}
            <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b-2 border-black">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-black text-white border-2 border-black flex items-center justify-center font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <span className="text-xl font-black tracking-tighter text-black uppercase">RevIQ Advisor</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <a href="#" className="text-sm font-bold uppercase text-black hover:underline decoration-2 underline-offset-4">Features</a>
                        <a href="#" className="text-sm font-bold uppercase text-black hover:underline decoration-2 underline-offset-4">Solutions</a>
                        <a href="#" className="text-sm font-bold uppercase text-black hover:underline decoration-2 underline-offset-4">Pricing</a>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-5 py-2 bg-black text-white text-sm font-black uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.5)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,0.5)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                        >
                            Log In
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 border-b-2 border-black bg-indigo-50 [background-image:radial-gradient(#a5b4fc_1px,transparent_1px)] [background-size:20px_20px]">
                <div className="container mx-auto px-6 text-center max-w-5xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-yellow-300 text-black text-xs font-black uppercase tracking-widest mb-8 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform -rotate-1 hover:rotate-0 transition-transform cursor-default">
                            <span className="w-2 h-2 rounded-full bg-black animate-pulse border border-black" />
                            New: Risk Heatmaps 2.0
                        </div>

                        <h1 className="text-6xl lg:text-8xl font-black tracking-tighter mb-8 text-black leading-[0.9]">
                            PREDICT CHURN. <br /> <span className="text-stroke-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800" style={{ WebkitTextStroke: '2px black' }}>SECURE REVENUE.</span>
                        </h1>

                        <p className="text-xl text-black font-medium mb-10 max-w-2xl mx-auto leading-relaxed border-l-4 border-black pl-6 text-left">
                            Stop guessing who will churn. RevIQ Advisor unifies your data to predict renewal risks and identify expansion opportunities with <span className="underline decoration-4 decoration-blue-500">94% accuracy</span>.
                        </p>

                        <div className="flex items-center justify-center gap-6">
                            <button
                                onClick={() => navigate('/login')}
                                className="px-8 py-4 bg-blue-600 text-white font-black text-lg uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2"
                            >
                                Start Free Trial
                                <ArrowRight className="w-5 h-5" />
                            </button>
                            <button className="px-8 py-4 bg-white text-black font-black text-lg uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                                View Demo
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 bg-zinc-50/50">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-zinc-900 mb-4">Enterprise-Grade Intelligence</h2>
                        <p className="text-zinc-500">Everything you need to secure your revenue base.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<BrainCircuit className="w-6 h-6 text-black" />}
                            iconBg="bg-white"
                            cardBg="bg-blue-100"
                            title="Predictive Analytics"
                            description="Our ML models analyze usage patterns, support tickets, and engagement metrics to generate a daily Churn Risk Score for every account."
                            delay={0.1}
                        />
                        <FeatureCard
                            icon={<Zap className="w-6 h-6 text-black" />}
                            iconBg="bg-white"
                            cardBg="bg-amber-100"
                            title="Real-Time Intervention"
                            description="Receive instant alerts via Slack or Email when key accounts show distress signals, allowing your CS team to act immediately."
                            delay={0.2}
                        />
                        <FeatureCard
                            icon={<BarChart3 className="w-6 h-6 text-black" />}
                            iconBg="bg-white"
                            cardBg="bg-emerald-100"
                            title="Expansion Discovery"
                            description="Automatically identify accounts ready for upsell based on feature usage saturation and license utilization trends."
                            delay={0.3}
                        />
                    </div>
                </div>
            </section>

            <footer className="py-12 border-t-2 border-black bg-white">
                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-black text-white flex items-center justify-center border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                            <span className="font-black text-xs text-white">R</span>
                        </div>
                        <span className="text-sm font-black text-black uppercase tracking-wide">RevIQ Advisor</span>
                    </div>
                    <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                        © 2025 RevIQ Inc. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}

// FeatureCard Component
function FeatureCard({ icon, iconBg, cardBg, title, description, delay }: { icon: React.ReactNode, iconBg: string, cardBg: string, title: string, description: string, delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay }}
            className={`p-8 ${cardBg} border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all`}
        >
            <div className={`w-12 h-12 ${iconBg} border-2 border-black flex items-center justify-center mb-6 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                {icon}
            </div>
            <h3 className="text-xl font-black text-black uppercase tracking-tight mb-3">{title}</h3>
            <p className="text-zinc-800 leading-relaxed text-sm font-bold border-l-2 border-black/20 pl-4">
                {description}
            </p>
        </motion.div>
    );
}
