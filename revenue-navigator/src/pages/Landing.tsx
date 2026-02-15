import { ArrowRight, Zap, BarChart3, Users, TrendingUp, Shield, Target, Bell, CheckCircle, Globe, Cpu, RefreshCw, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Landing() {
    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/20 selection:text-primary relative overflow-hidden">
            {/* Ambient Background Elements */}
            <div className="absolute top-0 left-0 w-full h-[100vh] bg-gradient-to-b from-red-50/30 to-transparent pointer-events-none -z-10" />
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] -z-10" />
            <div className="absolute bottom-[20%] left-[-5%] w-[30%] h-[30%] bg-accent/10 blur-[100px] -z-10" />

            {/* Top Navigation Bar */}
            <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b-4 border-foreground py-5 px-8" style={{ boxShadow: "0px 4px 0px 0px hsl(var(--foreground))" }}>
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="h-10 w-10 flex items-center justify-center bg-primary border-2 border-foreground group-hover:scale-110 transition-transform" style={{ boxShadow: "3px 3px 0px 0px hsl(var(--foreground))" }}>
                            <Zap className="h-5 w-5 text-white fill-white" />
                        </div>
                        <span className="text-xl font-black text-foreground tracking-tight uppercase">Revenue Navigator</span>
                    </div>
                    <div className="hidden md:flex items-center gap-10">
                        {['Features', 'Pricing', 'Case Studies', 'Resources'].map((item) => (
                            <a key={item} href="#" className="text-sm font-black text-foreground/60 hover:text-primary transition-colors tracking-wide uppercase text-[11px]">
                                {item}
                            </a>
                        ))}
                        <Link to="/signin" className="px-6 py-2.5 bg-white border-2 border-foreground text-primary text-[11px] font-black uppercase tracking-widest transition-all" style={{ boxShadow: "3px 3px 0px 0px hsl(var(--foreground))" }}>
                            Sign In
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Announcement Badge */}
            <div className="bg-accent border-b-4 border-foreground overflow-hidden">
                <motion.div
                    initial={{ x: "100%" }}
                    animate={{ x: "-100%" }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="whitespace-nowrap py-3 px-8 text-[10px] font-black uppercase tracking-[0.4em] text-white"
                >
                    🚀 NEXT-GEN AI RENEWAL INTELLIGENCE IS HERE • MAXIMIZE EVERY UPSELL OPPORTUNITY • ML-POWERED PREDICTIONS • REAL-TIME ANALYTICS •
                </motion.div>
            </div>

            {/* Hero Section */}
            <div className="relative py-20 lg:py-32">
                <div className="max-w-7xl mx-auto px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-24 items-center">
                        {/* Left Content */}
                        <div className="text-left">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border-2 border-foreground mb-8"
                                style={{ boxShadow: "3px 3px 0px 0px hsl(var(--foreground))" }}
                            >
                                <span className="flex h-2 w-2 bg-primary animate-pulse border border-foreground" />
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Revenue Intelligence v2.0</span>
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-6xl lg:text-7xl font-black text-foreground mb-8 leading-[1.05] tracking-tight uppercase"
                            >
                                Never miss a <span className="text-primary">renewal</span> again.
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-xl text-foreground/70 mb-10 max-w-xl leading-relaxed font-bold uppercase tracking-wide"
                            >
                                AI-powered insights that predict churn, identify expansion opportunities, and automate outreach—all in one elegant platform.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex flex-wrap gap-4 mb-16"
                            >
                                <Link
                                    to="/signin"
                                    className="px-10 py-5 bg-primary text-white border-2 border-foreground font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-3"
                                    style={{ boxShadow: "6px 6px 0px 0px hsl(var(--foreground))" }}
                                >
                                    Start Free Trial <ArrowRight size={18} />
                                </Link>
                                <Link
                                    to="/signin"
                                    className="px-10 py-5 bg-white text-foreground border-2 border-foreground font-black text-[11px] uppercase tracking-widest transition-all hover:bg-primary/5"
                                    style={{ boxShadow: "6px 6px 0px 0px hsl(var(--foreground))" }}
                                >
                                    Sign In
                                </Link>
                            </motion.div>

                            {/* Stats Cards */}
                            <div className="grid grid-cols-3 gap-6">
                                {[
                                    { label: 'CHURN_PREDICTION', value: 'ML-Powered', color: 'text-primary' },
                                    { label: 'REVENUE_OPTIMIZATION', value: 'Real-Time', color: 'text-indigo-600' },
                                    { label: 'ACCOUNT_MANAGEMENT', value: 'Automated', color: 'text-foreground' }
                                ].map((stat, i) => (
                                    <div key={i} className="group">
                                        <div className="text-3xl font-extrabold text-foreground mb-1 group-hover:text-primary transition-colors">{stat.value}</div>
                                        <div className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Visual - Dashboard Preview Card */}
                        <div className="relative hidden lg:block">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.4 }}
                                className="relative"
                            >
                                {/* Background Decorative Element */}
                                <div className="absolute -inset-10 bg-gradient-to-tr from-primary/20 to-purple-400/20 blur-3xl opacity-30 -z-10 animate-pulse" />

                                {/* Main Card */}
                                <div className="bg-white border-4 border-foreground p-10 relative" style={{ boxShadow: "8px 8px 0px 0px hsl(var(--foreground))" }}>
                                    {/* Top Badge */}
                                    <div className="absolute -top-4 -right-4 bg-primary text-white border-2 border-foreground px-5 py-2.5 rotate-6" style={{ boxShadow: "4px 4px 0px 0px hsl(var(--foreground))" }}>
                                        <span className="font-black text-[10px] tracking-widest uppercase">AI_CORE_ACTIVE</span>
                                    </div>

                                    {/* Account Icon */}
                                    <div className="flex items-center gap-5 mb-8">
                                        <div className="w-16 h-16 bg-primary/10 flex items-center justify-center border-2 border-foreground" style={{ boxShadow: "3px 3px 0px 0px hsl(var(--foreground))" }}>
                                            <TrendingUp className="h-8 w-8 text-primary" />
                                        </div>
                                        <div>
                                            <div className="text-xl font-black text-foreground tracking-tight uppercase">Account Renewal</div>
                                            <div className="text-[10px] text-foreground/60 font-black uppercase tracking-widest mt-1">Enterprise Cluster • Real-Time Data</div>
                                        </div>
                                    </div>

                                    {/* Progress Bars */}
                                    <div className="space-y-4 mb-10">
                                        <div className="h-3 bg-gray-100 border-2 border-foreground overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: "95%" }}
                                                className="h-full bg-primary border-r-2 border-foreground"
                                            />
                                        </div>
                                        <div className="h-3 bg-gray-100 border-2 border-foreground overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: "80%" }}
                                                className="h-full bg-accent border-r-2 border-foreground"
                                            />
                                        </div>
                                        <div className="h-3 bg-gray-100 border-2 border-foreground overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: "60%" }}
                                                className="h-full bg-success border-r-2 border-foreground"
                                            />
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center justify-between pt-8 border-t-4 border-foreground">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-red-50 border-2 border-foreground flex items-center justify-center" style={{ boxShadow: "2px 2px 0px 0px hsl(var(--foreground))" }}>
                                                <Bell size={16} className="text-red-500" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black uppercase text-foreground/60 tracking-widest">RISK_LEVEL</p>
                                                <span className="text-sm font-black text-red-500 uppercase">CRITICAL_FLAG</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black uppercase text-foreground/60 tracking-widest">DEADLINE</p>
                                            <span className="text-sm font-black text-foreground uppercase">14_DAYS</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Elements */}
                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                    className="absolute -top-12 -left-12 bg-white border-2 border-foreground p-4"
                                    style={{ boxShadow: "4px 4px 0px 0px hsl(var(--foreground))" }}
                                >
                                    <span className="text-3xl">🎯</span>
                                </motion.div>
                                <motion.div
                                    animate={{ y: [0, 10, 0] }}
                                    transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                                    className="absolute top-1/2 -right-12 bg-white border-2 border-foreground p-4 rotate-12"
                                    style={{ boxShadow: "4px 4px 0px 0px hsl(var(--foreground))" }}
                                >
                                    <span className="text-3xl">💰</span>
                                </motion.div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Trusted By Section */}
            <div className="bg-white py-16">
                <div className="max-w-7xl mx-auto px-8">
                    <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-12">
                        SYNERGIZED WITH THE WORLD'S BEST REVENUE TEAMS
                    </p>
                    <div className="flex items-center justify-center gap-16 flex-wrap opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                        {['Salesforce', 'HubSpot', 'Stripe', 'Zendesk', 'Atlassian', 'Intercom', 'Zoom', 'Slack'].map((brand) => (
                            <div key={brand} className="text-xl font-black text-foreground tracking-tighter uppercase font-display italic">
                                {brand}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Feature Cards Section */}
            <div className="bg-gray-50/50 py-32 border-y border-gray-50">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                icon: <Target className="w-8 h-8 text-primary" />,
                                title: "CHURN_PREDICTION",
                                description: "AI models analyze usage patterns, engagement metrics, and customer health to flag at-risk accounts 90 days in advance."
                            },
                            {
                                icon: <BarChart3 className="w-8 h-8 text-indigo-500" />,
                                title: "EXPANSION_NODE",
                                description: "Automatically surface upsell and cross-sell opportunities based on product usage, team growth, and feature adoption."
                            },
                            {
                                icon: <RefreshCw className="w-8 h-8 text-emerald-500" />,
                                title: "AUTO_OUTREACH",
                                description: "Multi-channel campaigns triggered at critical lifecycle moments—email, Slack, and in-app notifications."
                            },
                            {
                                icon: <Cpu className="w-8 h-8 text-amber-500" />,
                                title: "REVENUE_INTEL",
                                description: "Live dashboards showing pipeline health, renewal forecasts, and expansion metrics—all synced with your CRM."
                            }
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{ y: -8 }}
                                className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-xl shadow-purple-900/[0.03] hover:shadow-primary/5 transition-all group"
                            >
                                <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-primary/5 transition-colors">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xs font-black text-foreground mb-4 uppercase tracking-[0.2em]">{feature.title}</h3>
                                <p className="text-[13px] text-gray-500 leading-relaxed font-medium">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-white py-32 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-10" />
                <div className="max-w-4xl mx-auto text-center px-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-5xl lg:text-6xl font-extrabold text-foreground mb-10 leading-tight tracking-tight">
                            Ready to <span className="text-primary underline decoration-primary/20 decoration-8 underline-offset-8">maximize</span> your revenue?
                        </h2>
                        <div className="flex justify-center flex-col sm:flex-row gap-6">
                            <Link
                                to="/signin"
                                className="px-12 py-5 bg-primary text-white rounded-[1.25rem] font-black text-[11px] uppercase tracking-widest hover:scale-105 transition-all shadow-2xl shadow-primary/30"
                            >
                                Start Free Trial
                            </Link>
                            <button className="px-12 py-5 bg-white text-foreground border border-gray-100 rounded-[1.25rem] font-black text-[11px] uppercase tracking-widest hover:bg-gray-50 transition-all shadow-xl shadow-purple-900/5 flex items-center justify-center gap-3">
                                Talk to Sales <ArrowRight size={18} />
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-50 py-20 px-8 border-t border-gray-100">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
                        {/* Brand Column */}
                        <div className="col-span-1 md:col-span-1">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="h-9 w-9 flex items-center justify-center bg-primary rounded-xl shadow-lg shadow-primary/20">
                                    <Zap className="h-4 w-4 text-white fill-white" />
                                </div>
                                <span className="text-lg font-extrabold text-foreground tracking-tight">Revenue Navigator</span>
                            </div>
                            <p className="text-sm text-gray-500 mb-8 leading-relaxed font-medium">
                                AI-powered renewal intelligence and upsell automation for modern revenue teams.
                            </p>
                            <div className="flex gap-4">
                                {[Globe, Shield, Heart].map((Icon, i) => (
                                    <div key={i} className="h-10 w-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary/20 transition-all cursor-pointer">
                                        <Icon size={18} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Link Columns */}
                        {[
                            { title: 'PRODUCT', links: ['Features', 'Integrations', 'API Docs', 'Pricing'] },
                            { title: 'SOLUTIONS', links: ['Renewals', 'Upsells', 'Churn Prevention', 'Expansion'] },
                            { title: 'COMPANY', links: ['About', 'Blog', 'Careers', 'Contact'] }
                        ].map((col) => (
                            <div key={col.title}>
                                <h4 className="text-[10px] font-black text-foreground mb-8 uppercase tracking-widest">{col.title}</h4>
                                <ul className="space-y-4">
                                    {col.links.map((link) => (
                                        <li key={link}>
                                            <a href="#" className="text-sm text-gray-400 font-bold hover:text-primary transition-colors">
                                                {link}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* Bottom Bar */}
                    <div className="pt-10 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                            © 2026 REVENUE NAVIGATOR • BUILT FOR SCALE
                        </p>
                        <div className="flex items-center gap-3 px-4 py-2 bg-white border border-gray-100 rounded-full">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Global Status:</span>
                            <div className="flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest uppercase">System Operational</span>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

