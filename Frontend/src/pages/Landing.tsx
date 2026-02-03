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
            <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-zinc-200">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center font-bold">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-zinc-900">RevIQ Advisor</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <a href="#" className="text-sm font-medium text-zinc-600 hover:text-primary transition-colors">Features</a>
                        <a href="#" className="text-sm font-medium text-zinc-600 hover:text-primary transition-colors">Solutions</a>
                        <a href="#" className="text-sm font-medium text-zinc-600 hover:text-primary transition-colors">Pricing</a>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-5 py-2 rounded bg-zinc-900 text-white text-sm font-bold hover:bg-zinc-800 transition-colors"
                        >
                            Log In
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 border-b border-zinc-100">
                <div className="container mx-auto px-6 text-center max-w-5xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wide mb-6 border border-blue-100">
                            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                            New: Risk Heatmaps live now
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-8 text-zinc-900 leading-[1.1]">
                            The Intelligence Layer for <br /> <span className="text-primary">Customer Retention</span>
                        </h1>

                        <p className="text-xl text-zinc-500 mb-10 max-w-2xl mx-auto leading-relaxed font-normal">
                            Stop guessing who will churn. RevIQ Advisor unifies your data to predict renewal risks and identify expansion opportunities with 94% accuracy.
                        </p>

                        <div className="flex items-center justify-center gap-4">
                            <button
                                onClick={() => navigate('/login')}
                                className="px-8 py-3.5 rounded bg-primary text-white font-bold text-lg hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
                            >
                                Start Free Trial
                                <ArrowRight className="w-4 h-4" />
                            </button>
                            <button className="px-8 py-3.5 rounded bg-white border border-zinc-200 text-zinc-700 font-bold text-lg hover:border-zinc-300 hover:bg-zinc-50 transition-all">
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
                            icon={<BrainCircuit className="w-6 h-6 text-white" />}
                            iconBg="bg-blue-600"
                            title="Predictive Analytics"
                            description="Our ML models analyze usage patterns, support tickets, and engagement metrics to generate a daily Churn Risk Score for every account."
                            delay={0.1}
                        />
                        <FeatureCard
                            icon={<Zap className="w-6 h-6 text-white" />}
                            iconBg="bg-amber-500"
                            title="Real-Time Intervention"
                            description="Receive instant alerts via Slack or Email when key accounts show distress signals, allowing your CS team to act immediately."
                            delay={0.2}
                        />
                        <FeatureCard
                            icon={<BarChart3 className="w-6 h-6 text-white" />}
                            iconBg="bg-emerald-500"
                            title="Expansion Discovery"
                            description="Automatically identify accounts ready for upsell based on feature usage saturation and license utilization trends."
                            delay={0.3}
                        />
                    </div>
                </div>
            </section>

            <footer className="py-12 border-t border-zinc-200 bg-white">
                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-zinc-200 flex items-center justify-center">
                            <span className="font-bold text-xs text-zinc-600">R</span>
                        </div>
                        <span className="text-sm font-bold text-zinc-700">RevIQ Advisor</span>
                    </div>
                    <div className="text-sm text-zinc-400">
                        © 2025 RevIQ Inc. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, iconBg, title, description, delay }: { icon: React.ReactNode, iconBg: string, title: string, description: string, delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay }}
            className="p-8 rounded-xl bg-white border border-zinc-200 shadow-sm hover:shadow-md transition-shadow"
        >
            <div className={`w-12 h-12 rounded-lg ${iconBg} flex items-center justify-center mb-6 shadow-sm`}>
                {icon}
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-3">{title}</h3>
            <p className="text-zinc-600 leading-relaxed text-sm">
                {description}
            </p>
        </motion.div>
    );
}
