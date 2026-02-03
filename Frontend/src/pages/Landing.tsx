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
        <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary/20">
            {/* Navigation */}
            <nav className="fixed w-full z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center text-white font-bold">
                            R
                        </div>
                        <span className="text-xl font-bold tracking-tight">RevIQ Advisor</span>
                    </div>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-6 py-2.5 rounded-full bg-secondary/50 text-foreground text-sm font-medium hover:bg-secondary transition-colors"
                    >
                        Sign In
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32">
                {/* Background Gradients */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full overflow-hidden -z-10 pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] mix-blend-screen" />
                    <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] mix-blend-screen" />
                </div>

                <div className="container mx-auto px-6">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="text-center max-w-4xl mx-auto"
                    >
                        <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-8 border border-primary/20">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                            </span>
                            v2.0 Now Available with Real-Time Alerts
                        </motion.div>

                        <motion.h1 variants={itemVariants} className="text-5xl lg:text-7xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/50">
                            Stop Churn Before <br /> It Happens.
                        </motion.h1>

                        <motion.p variants={itemVariants} className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
                            RevIQ Advisor uses advanced AI to predict renewal risks, identify upsell opportunities, and automate your customer success playbooks.
                        </motion.p>

                        <motion.div variants={itemVariants} className="flex items-center justify-center gap-4">
                            <button
                                onClick={() => navigate('/login')}
                                className="group px-8 py-4 rounded-full bg-primary text-primary-foreground font-semibold text-lg hover:shadow-lg hover:shadow-primary/25 transition-all flex items-center gap-2"
                            >
                                Get Started
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button className="px-8 py-4 rounded-full bg-white/5 border border-white/10 text-foreground font-semibold text-lg hover:bg-white/10 transition-colors">
                                Watch Demo
                            </button>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 bg-secondary/20">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<BrainCircuit className="w-6 h-6 text-primary" />}
                            title="Predictive AI"
                            description="Analyze thousands of data points to predict which customers are at risk of churning with 94% accuracy."
                            delay={0.2}
                        />
                        <FeatureCard
                            icon={<Zap className="w-6 h-6 text-yellow-500" />}
                            title="Real-Time Alerts"
                            description="Get instant notifications when high-value accounts show distress signals, enabling immediate intervention."
                            delay={0.3}
                        />
                        <FeatureCard
                            icon={<BarChart3 className="w-6 h-6 text-green-500" />}
                            title="Revenue Intelligence"
                            description="Identify hidden upsell opportunities based on usage patterns and growth trajectory."
                            delay={0.4}
                        />
                    </div>
                </div>
            </section>

            {/* Trust Section */}
            <section className="py-24 border-t border-white/5">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-2xl font-semibold mb-12">Trusted by modern enterprise teams</h2>
                    <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Simple text placeholders for logos for now */}
                        <span className="text-xl font-bold">ACME Corp</span>
                        <span className="text-xl font-bold">Globex</span>
                        <span className="text-xl font-bold">Soylent Corp</span>
                        <span className="text-xl font-bold">Initech</span>
                        <span className="text-xl font-bold">Umbrella</span>
                    </div>
                </div>
            </section>
        </div>
    );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay }}
            className="p-8 rounded-2xl bg-background border border-border/50 hover:border-primary/50 transition-colors group"
        >
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">
                {description}
            </p>
        </motion.div>
    );
}
