import { ArrowRight, Zap, BarChart3, Users, TrendingUp, Shield, Target, Bell, CheckCircle, Globe, Cpu, RefreshCw, Heart, Play, X, Sparkles, Activity, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useState, useRef } from "react";

export default function Landing() {
    const [showDemo, setShowDemo] = useState(false);
    const heroRef = useRef(null);
    const heroInView = useInView(heroRef, { once: true, amount: 0.3 });
    
    // Removed parallax transforms to prevent blur issues on scroll

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: [0.25, 0.1, 0.25, 1]
            }
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-primary/20 selection:text-primary relative overflow-hidden">
            {/* Enhanced Ambient Background Elements */}
            <motion.div 
                className="absolute top-0 left-0 w-full h-[100vh] bg-gradient-to-b from-red-50/30 to-transparent pointer-events-none -z-10"
                animate={{
                    background: [
                        "linear-gradient(to bottom, rgba(239, 68, 68, 0.1), transparent)",
                        "linear-gradient(to bottom, rgba(139, 92, 246, 0.1), transparent)",
                        "linear-gradient(to bottom, rgba(239, 68, 68, 0.1), transparent)"
                    ]
                }}
                transition={{ duration: 8, repeat: Infinity }}
            />
            <motion.div 
                className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[40px] -z-10"
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 6, repeat: Infinity }}
                style={{ willChange: "transform, opacity" }}
            />
            <motion.div 
                className="absolute bottom-[20%] left-[-5%] w-[30%] h-[30%] bg-accent/10 blur-[35px] -z-10"
                animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.2, 0.4, 0.2]
                }}
                transition={{ duration: 8, repeat: Infinity, delay: 1 }}
                style={{ willChange: "transform, opacity" }}
            />

            {/* Enhanced Top Navigation Bar */}
            <motion.nav 
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                className="sticky top-0 z-50 bg-white border-b-4 border-foreground py-5 px-8"
                style={{ 
                    boxShadow: "0px 4px 0px 0px hsl(var(--foreground))",
                    willChange: "transform"
                }}
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <motion.div 
                        className="flex items-center gap-3 group cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <motion.div 
                            className="h-10 w-10 flex items-center justify-center bg-primary border-2 border-foreground"
                            style={{ boxShadow: "3px 3px 0px 0px hsl(var(--foreground))" }}
                            whileHover={{ rotate: 360, scale: 1.1 }}
                            transition={{ duration: 0.6 }}
                        >
                            <Zap className="h-5 w-5 text-white fill-white" />
                        </motion.div>
                        <span className="text-xl font-black text-foreground tracking-tight uppercase">Revenue Navigator</span>
                    </motion.div>
                    <div className="hidden md:flex items-center gap-10">
                        {['Features', 'Pricing', 'Case Studies', 'Resources'].map((item, i) => (
                            <motion.a 
                                key={item}
                                href="#" 
                                className="text-sm font-black text-foreground/60 hover:text-primary transition-colors tracking-wide uppercase text-[11px]"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * i }}
                                whileHover={{ y: -2 }}
                            >
                                {item}
                            </motion.a>
                        ))}
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Link 
                                to="/signin" 
                                className="px-6 py-2.5 bg-white border-2 border-foreground text-primary text-[11px] font-black uppercase tracking-widest transition-all"
                                style={{ boxShadow: "3px 3px 0px 0px hsl(var(--foreground))" }}
                            >
                            Sign In
                        </Link>
                        </motion.div>
                    </div>
                </div>
            </motion.nav>

            {/* Enhanced Announcement Badge */}
            <div className="bg-accent border-b-4 border-foreground overflow-hidden relative">
                <motion.div
                    initial={{ x: "100%" }}
                    animate={{ x: "-100%" }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="whitespace-nowrap py-3 px-8 text-[10px] font-black uppercase tracking-[0.4em] text-white"
                >
                    🚀 NEXT-GEN AI RENEWAL INTELLIGENCE IS HERE • MAXIMIZE EVERY UPSELL OPPORTUNITY • ML-POWERED PREDICTIONS • REAL-TIME ANALYTICS • AUTOMATED OUTREACH • CHURN PREVENTION •
                </motion.div>
            </div>

            {/* Enhanced Hero Section */}
            <motion.div 
                ref={heroRef}
                className="relative py-20 lg:py-32"
            >
                <div className="max-w-7xl mx-auto px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-24 items-center">
                        {/* Left Content */}
                        <motion.div 
                            className="text-left"
                            variants={containerVariants}
                            initial="hidden"
                            animate={heroInView ? "visible" : "hidden"}
                        >
                            <motion.div
                                variants={itemVariants}
                                className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border-2 border-foreground mb-8"
                                style={{ boxShadow: "3px 3px 0px 0px hsl(var(--foreground))" }}
                                whileHover={{ scale: 1.05, rotate: 1 }}
                            >
                                <motion.span 
                                    className="flex h-2 w-2 bg-primary border border-foreground"
                                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Revenue Intelligence v2.0</span>
                            </motion.div>

                            <motion.h1
                                variants={itemVariants}
                                className="text-6xl lg:text-7xl font-black text-foreground mb-8 leading-[1.05] tracking-tight uppercase"
                            >
                                Never miss a <motion.span 
                                    className="text-primary inline-block"
                                    animate={{ 
                                        scale: [1, 1.05, 1],
                                        textShadow: [
                                            "0 0 0px rgba(139, 92, 246, 0)",
                                            "0 0 20px rgba(139, 92, 246, 0.5)",
                                            "0 0 0px rgba(139, 92, 246, 0)"
                                        ]
                                    }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                >renewal</motion.span> again.
                            </motion.h1>

                            <motion.p
                                variants={itemVariants}
                                className="text-xl text-foreground/70 mb-10 max-w-xl leading-relaxed font-bold uppercase tracking-wide"
                            >
                                AI-powered insights that predict churn, identify expansion opportunities, and automate outreach—all in one elegant platform.
                            </motion.p>

                            <motion.div
                                variants={itemVariants}
                                className="flex flex-wrap gap-4 mb-16"
                            >
                                <motion.div
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                            >
                                <Link
                                    to="/signin"
                                    className="px-10 py-5 bg-primary text-white border-2 border-foreground font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-3"
                                    style={{ boxShadow: "6px 6px 0px 0px hsl(var(--foreground))" }}
                                >
                                    Start Free Trial <ArrowRight size={18} />
                                </Link>
                                </motion.div>
                                <motion.div
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Link
                                        to="/signin"
                                        className="px-10 py-5 bg-white text-foreground border-2 border-foreground font-black text-[11px] uppercase tracking-widest transition-all hover:bg-primary/5"
                                        style={{ boxShadow: "6px 6px 0px 0px hsl(var(--foreground))" }}
                                    >
                                        Sign In
                                    </Link>
                                </motion.div>
                                <motion.div
                                    whileHover={{ scale: 1.05, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <button
                                        onClick={() => setShowDemo(true)}
                                        className="px-10 py-5 bg-accent text-white border-2 border-foreground font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-3 group"
                                        style={{ boxShadow: "6px 6px 0px 0px hsl(var(--foreground))" }}
                                    >
                                        <Play size={18} className="group-hover:scale-110 transition-transform" />
                                    Watch Demo
                                </button>
                                </motion.div>
                            </motion.div>

                            {/* Enhanced Stats Cards */}
                            <motion.div 
                                variants={itemVariants}
                                className="grid grid-cols-3 gap-6"
                            >
                                {[
                                    { label: 'CHURN_PREDICTION', value: 'ML-Powered', color: 'text-primary', icon: Target },
                                    { label: 'REVENUE_OPTIMIZATION', value: 'Real-Time', color: 'text-indigo-600', icon: Activity },
                                    { label: 'ACCOUNT_MANAGEMENT', value: 'Automated', color: 'text-foreground', icon: DollarSign }
                                ].map((stat, i) => (
                                    <motion.div 
                                        key={i} 
                                        className="group"
                                        whileHover={{ scale: 1.05, y: -5 }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={heroInView ? { opacity: 1, y: 0 } : {}}
                                        transition={{ delay: 0.5 + i * 0.1 }}
                                    >
                                        <div className="bg-white border-2 border-foreground p-4" style={{ boxShadow: "3px 3px 0px 0px hsl(var(--foreground))" }}>
                                            <stat.icon className={`w-6 h-6 ${stat.color} mb-2`} />
                                            <div className={`text-2xl font-extrabold ${stat.color} mb-1 group-hover:text-primary transition-colors`}>{stat.value}</div>
                                        <div className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{stat.label}</div>
                                    </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </motion.div>

                        {/* Enhanced Right Visual - Dashboard Preview Card */}
                            <motion.div
                            className="relative hidden lg:block"
                            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                            animate={heroInView ? { opacity: 1, scale: 1, rotate: 0 } : {}}
                            transition={{ delay: 0.4, duration: 0.8, type: "spring", stiffness: 100 }}
                        >
                            {/* Enhanced Background Decorative Element */}
                            <motion.div 
                                className="absolute -inset-10 bg-gradient-to-tr from-primary/20 to-purple-400/20 blur-lg opacity-30 -z-10"
                                animate={{
                                    scale: [1, 1.2, 1],
                                    rotate: [0, 180, 360],
                                    opacity: [0.3, 0.5, 0.3]
                                }}
                                transition={{ duration: 8, repeat: Infinity }}
                                style={{ willChange: "transform, opacity" }}
                            />

                                {/* Main Card */}
                            <motion.div 
                                className="bg-white border-4 border-foreground p-10 relative"
                                style={{ boxShadow: "8px 8px 0px 0px hsl(var(--foreground))" }}
                                whileHover={{ scale: 1.02, y: -5 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                    {/* Top Badge */}
                                <motion.div 
                                    className="absolute -top-4 -right-4 bg-primary text-white border-2 border-foreground px-5 py-2.5"
                                    style={{ boxShadow: "4px 4px 0px 0px hsl(var(--foreground))" }}
                                    animate={{ rotate: [6, -6, 6] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                >
                                        <span className="font-black text-[10px] tracking-widest uppercase">AI_CORE_ACTIVE</span>
                                </motion.div>

                                    {/* Account Icon */}
                                    <div className="flex items-center gap-5 mb-8">
                                    <motion.div 
                                        className="w-16 h-16 bg-primary/10 flex items-center justify-center border-2 border-foreground"
                                        style={{ boxShadow: "3px 3px 0px 0px hsl(var(--foreground))" }}
                                        whileHover={{ rotate: 360 }}
                                        transition={{ duration: 0.6 }}
                                    >
                                            <TrendingUp className="h-8 w-8 text-primary" />
                                    </motion.div>
                                        <div>
                                        <div className="text-xl font-black text-foreground tracking-tight uppercase">Account Renewal</div>
                                        <div className="text-[10px] text-foreground/60 font-black uppercase tracking-widest mt-1">Enterprise Cluster • Real-Time Data</div>
                                        </div>
                                    </div>

                                {/* Enhanced Progress Bars */}
                                    <div className="space-y-4 mb-10">
                                    {[
                                        { width: "95%", color: "bg-primary", delay: 0.2 },
                                        { width: "80%", color: "bg-accent", delay: 0.4 },
                                        { width: "60%", color: "bg-success", delay: 0.6 }
                                    ].map((bar, i) => (
                                        <div key={i} className="h-3 bg-gray-100 border-2 border-foreground overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: bar.width }}
                                                transition={{ delay: bar.delay, duration: 1, ease: "easeOut" }}
                                                className={`h-full ${bar.color} border-r-2 border-foreground`}
                                            />
                                        </div>
                                    ))}
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center justify-between pt-8 border-t-4 border-foreground">
                                    <motion.div 
                                        className="flex items-center gap-3"
                                        whileHover={{ scale: 1.05 }}
                                    >
                                            <div className="h-10 w-10 bg-red-50 border-2 border-foreground flex items-center justify-center" style={{ boxShadow: "2px 2px 0px 0px hsl(var(--foreground))" }}>
                                                <Bell size={16} className="text-red-500" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black uppercase text-foreground/60 tracking-widest">RISK_LEVEL</p>
                                                <span className="text-sm font-black text-red-500 uppercase">CRITICAL_FLAG</span>
                                            </div>
                                    </motion.div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black uppercase text-foreground/60 tracking-widest">DEADLINE</p>
                                        <motion.span 
                                            className="text-sm font-black text-foreground uppercase"
                                            animate={{ opacity: [1, 0.5, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            14_DAYS
                                        </motion.span>
                                        </div>
                                    </div>
                            </motion.div>

                            {/* Enhanced Floating Elements */}
                                <motion.div
                                animate={{ 
                                    y: [0, -15, 0],
                                    rotate: [0, 5, 0]
                                }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute -top-12 -left-12 bg-white border-2 border-foreground p-4"
                                    style={{ boxShadow: "4px 4px 0px 0px hsl(var(--foreground))" }}
                                whileHover={{ scale: 1.2, rotate: 360 }}
                                >
                                    <span className="text-3xl">🎯</span>
                                </motion.div>
                                <motion.div
                                animate={{ 
                                    y: [0, 15, 0],
                                    rotate: [12, -12, 12]
                                }}
                                transition={{ duration: 3, repeat: Infinity, delay: 0.5, ease: "easeInOut" }}
                                className="absolute top-1/2 -right-12 bg-white border-2 border-foreground p-4"
                                    style={{ boxShadow: "4px 4px 0px 0px hsl(var(--foreground))" }}
                                whileHover={{ scale: 1.2, rotate: -360 }}
                                >
                                    <span className="text-3xl">💰</span>
                                </motion.div>
                            <motion.div
                                animate={{ 
                                    y: [0, -10, 0],
                                    x: [0, 10, 0]
                                }}
                                transition={{ duration: 5, repeat: Infinity, delay: 1, ease: "easeInOut" }}
                                className="absolute -bottom-8 left-1/4 bg-white border-2 border-foreground p-3"
                                style={{ boxShadow: "4px 4px 0px 0px hsl(var(--foreground))" }}
                                whileHover={{ scale: 1.2 }}
                            >
                                <Sparkles className="w-6 h-6 text-primary" />
                            </motion.div>
                            </motion.div>
                        </div>
                    </div>
            </motion.div>

            {/* Enhanced Trusted By Section */}
            <motion.div 
                className="bg-white py-16"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.8 }}
            >
                <div className="max-w-7xl mx-auto px-8">
                    <motion.p 
                        className="text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-12"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        SYNERGIZED WITH THE WORLD'S BEST REVENUE TEAMS
                    </motion.p>
                    <div className="flex items-center justify-center gap-16 flex-wrap">
                        {['Salesforce', 'HubSpot', 'Stripe', 'Zendesk', 'Atlassian', 'Intercom', 'Zoom', 'Slack'].map((brand, i) => (
                            <motion.div 
                                key={brand}
                                className="text-xl font-black text-foreground tracking-tighter uppercase font-display italic opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700"
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 0.3, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ scale: 1.2, opacity: 1 }}
                            >
                                {brand}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Enhanced Feature Cards Section */}
            <div className="bg-gray-50/50 py-32 border-y border-gray-50">
                <div className="max-w-7xl mx-auto px-8">
                    <motion.h2
                        className="text-4xl font-black text-foreground mb-4 text-center uppercase tracking-tight"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        POWERED BY <span className="text-primary">AI</span>
                    </motion.h2>
                    <motion.p
                        className="text-center text-foreground/60 mb-16 font-bold uppercase tracking-wide"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        Everything you need to maximize revenue
                    </motion.p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                icon: <Target className="w-8 h-8 text-primary" />,
                                title: "CHURN_PREDICTION",
                                description: "AI models analyze usage patterns, engagement metrics, and customer health to flag at-risk accounts 90 days in advance.",
                                color: "from-primary/10 to-primary/5"
                            },
                            {
                                icon: <BarChart3 className="w-8 h-8 text-indigo-500" />,
                                title: "EXPANSION_NODE",
                                description: "Automatically surface upsell and cross-sell opportunities based on product usage, team growth, and feature adoption.",
                                color: "from-indigo-500/10 to-indigo-500/5"
                            },
                            {
                                icon: <RefreshCw className="w-8 h-8 text-emerald-500" />,
                                title: "AUTO_OUTREACH",
                                description: "Multi-channel campaigns triggered at critical lifecycle moments—email, Slack, and in-app notifications.",
                                color: "from-emerald-500/10 to-emerald-500/5"
                            },
                            {
                                icon: <Cpu className="w-8 h-8 text-amber-500" />,
                                title: "REVENUE_INTEL",
                                description: "Live dashboards showing pipeline health, renewal forecasts, and expansion metrics—all synced with your CRM.",
                                color: "from-amber-500/10 to-amber-500/5"
                            }
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.3 }}
                                transition={{ delay: idx * 0.1, duration: 0.6 }}
                                whileHover={{ y: -12, scale: 1.02 }}
                                className="bg-white border-2 border-foreground rounded-lg p-8 relative overflow-hidden group"
                                style={{ boxShadow: "4px 4px 0px 0px hsl(var(--foreground))" }}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                                <motion.div 
                                    className="h-16 w-16 bg-gray-50 rounded-xl flex items-center justify-center mb-8 relative z-10 group-hover:bg-primary/5 transition-colors"
                                    whileHover={{ rotate: 360, scale: 1.1 }}
                                    transition={{ duration: 0.6 }}
                                >
                                    {feature.icon}
                                </motion.div>
                                <h3 className="text-xs font-black text-foreground mb-4 uppercase tracking-[0.2em] relative z-10">{feature.title}</h3>
                                <p className="text-[13px] text-gray-500 leading-relaxed font-medium relative z-10">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Enhanced CTA Section */}
            <div className="bg-white py-32 relative overflow-hidden">
                <motion.div 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[40px] -z-10"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ duration: 6, repeat: Infinity }}
                    style={{ willChange: "transform, opacity" }}
                />
                <div className="max-w-4xl mx-auto text-center px-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <motion.h2 
                            className="text-5xl lg:text-6xl font-extrabold text-foreground mb-10 leading-tight tracking-tight"
                            animate={{
                                backgroundPosition: ["0%", "100%", "0%"]
                            }}
                            transition={{ duration: 5, repeat: Infinity }}
                        >
                            Ready to <motion.span 
                                className="text-primary inline-block"
                                animate={{ 
                                    scale: [1, 1.05, 1],
                                    textShadow: [
                                        "0 0 0px rgba(139, 92, 246, 0)",
                                        "0 0 30px rgba(139, 92, 246, 0.6)",
                                        "0 0 0px rgba(139, 92, 246, 0)"
                                    ]
                                }}
                                transition={{ duration: 3, repeat: Infinity }}
                            >maximize</motion.span> your revenue?
                        </motion.h2>
                        <div className="flex justify-center flex-col sm:flex-row gap-6">
                            <motion.div
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                            >
                            <Link
                                to="/signin"
                                    className="px-12 py-5 bg-primary text-white border-2 border-foreground font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-3"
                                    style={{ boxShadow: "6px 6px 0px 0px hsl(var(--foreground))" }}
                            >
                                    Start Free Trial <ArrowRight size={18} />
                            </Link>
                            </motion.div>
                            <motion.div
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <button 
                                    onClick={() => setShowDemo(true)}
                                    className="px-12 py-5 bg-white text-foreground border-2 border-foreground font-black text-[11px] uppercase tracking-widest transition-all hover:bg-primary/5 flex items-center justify-center gap-3"
                                    style={{ boxShadow: "6px 6px 0px 0px hsl(var(--foreground))" }}
                                >
                                    <Play size={18} />
                                    Watch Demo
                            </button>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Animated Purple CTA Section */}
            <motion.section 
                className="relative bg-white py-32 px-8 overflow-hidden"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.8 }}
            >
                {/* Animated Purple Grid Background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                        className="absolute bottom-0 left-0 w-full h-[40%] opacity-20"
                        animate={{
                            backgroundPosition: ['0% 0%', '100% 100%'],
                        }}
                        transition={{
                            duration: 20,
                            repeat: Infinity,
                            repeatType: 'reverse',
                            ease: 'linear'
                        }}
                        style={{
                            backgroundImage: `
                                linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px),
                                linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)
                            `,
                            backgroundSize: '60px 60px',
                            backgroundPosition: '0 0',
                            transform: 'perspective(500px) rotateX(60deg)',
                            transformOrigin: 'bottom center',
                        }}
                    />
                    {/* Floating purple orbs */}
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute rounded-full bg-primary/10 blur-xl"
                            style={{
                                width: `${100 + i * 30}px`,
                                height: `${100 + i * 30}px`,
                                left: `${i * 15}%`,
                                bottom: `${i * 10}%`,
                            }}
                            animate={{
                                y: [0, -30, 0],
                                x: [0, 20, 0],
                                scale: [1, 1.2, 1],
                                opacity: [0.1, 0.2, 0.1],
                            }}
                            transition={{
                                duration: 4 + i,
                                repeat: Infinity,
                                delay: i * 0.5,
                                ease: 'easeInOut',
                            }}
                        />
                    ))}
                </div>

                {/* Content */}
                <div className="relative z-10 max-w-4xl mx-auto text-center">
                    <motion.h2
                        className="text-5xl md:text-6xl lg:text-7xl font-black text-foreground mb-8 tracking-tight"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        Let's get you{' '}
                        <motion.span
                            className="text-primary"
                            animate={{
                                textShadow: [
                                    '0 0 0px hsl(var(--primary))',
                                    '0 0 20px hsl(var(--primary))',
                                    '0 0 0px hsl(var(--primary))',
                                ],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        >
                            navigating smarter
                        </motion.span>
                        .
                    </motion.h2>

                    {/* CTA Buttons */}
                    <motion.div
                        className="flex flex-col sm:flex-row items-center justify-center gap-6"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-8 py-4 bg-primary text-white rounded-lg font-black text-base uppercase tracking-wider border-2 border-foreground relative overflow-hidden group"
                            style={{ boxShadow: "4px 4px 0px 0px hsl(var(--foreground))" }}
                            onClick={() => setShowDemo(true)}
                        >
                            <motion.span
                                className="absolute inset-0 bg-white/20"
                                initial={{ x: '-100%' }}
                                whileHover={{ x: '100%' }}
                                transition={{ duration: 0.5 }}
                            />
                            <span className="relative z-10 flex items-center gap-2">
                                Explore Dashboard
                                <motion.span
                                    animate={{ x: [0, 5, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                    <ArrowRight size={20} />
                                </motion.span>
                            </span>
                        </motion.button>

                        <motion.a
                            href="#features"
                            whileHover={{ x: 5 }}
                            className="text-lg font-black text-foreground flex items-center gap-2 group"
                        >
                            <span className="wavy-underline-primary">Find a mentor</span>
                            <motion.span
                                animate={{ x: [0, 5, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="text-primary"
                            >
                                →
                            </motion.span>
                        </motion.a>
                    </motion.div>

                    {/* Animated decorative elements */}
                    <motion.div
                        className="absolute top-10 left-10 w-20 h-20 border-2 border-primary/30 rounded-lg"
                        animate={{
                            rotate: [0, 90, 0],
                            scale: [1, 1.1, 1],
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                    <motion.div
                        className="absolute top-20 right-20 w-16 h-16 bg-primary/10 rounded-full"
                        animate={{
                            y: [0, -20, 0],
                            scale: [1, 1.2, 1],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                    <motion.div
                        className="absolute bottom-10 left-1/4 w-12 h-12 border-2 border-primary/20 rounded-lg rotate-45"
                        animate={{
                            rotate: [45, 135, 45],
                            opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                            duration: 5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                </div>
            </motion.section>

            {/* Enhanced Footer */}
            <footer className="bg-gray-50 py-20 px-8 border-t border-gray-100">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
                        {/* Brand Column */}
                        <motion.div 
                            className="col-span-1 md:col-span-1"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="flex items-center gap-3 mb-8">
                                <motion.div 
                                    className="h-9 w-9 flex items-center justify-center bg-primary rounded-xl shadow-lg shadow-primary/20"
                                    whileHover={{ rotate: 360, scale: 1.1 }}
                                    transition={{ duration: 0.6 }}
                                >
                                    <Zap className="h-4 w-4 text-white fill-white" />
                                </motion.div>
                                <span className="text-lg font-extrabold text-foreground tracking-tight">Revenue Navigator</span>
                            </div>
                            <p className="text-sm text-gray-500 mb-8 leading-relaxed font-medium">
                                AI-powered renewal intelligence and upsell automation for modern revenue teams.
                            </p>
                            <div className="flex gap-4">
                                {[Globe, Shield, Heart].map((Icon, i) => (
                                    <motion.div 
                                        key={i}
                                        className="h-10 w-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary/20 transition-all cursor-pointer"
                                        whileHover={{ scale: 1.1, rotate: 360 }}
                                        whileTap={{ scale: 0.9 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <Icon size={18} />
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Link Columns */}
                        {[
                            { title: 'PRODUCT', links: ['Features', 'Integrations', 'API Docs', 'Pricing'] },
                            { title: 'SOLUTIONS', links: ['Renewals', 'Upsells', 'Churn Prevention', 'Expansion'] },
                            { title: 'COMPANY', links: ['About', 'Blog', 'Careers', 'Contact'] }
                        ].map((col, colIdx) => (
                            <motion.div 
                                key={col.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: colIdx * 0.1 }}
                            >
                                <h4 className="text-[10px] font-black text-foreground mb-8 uppercase tracking-widest">{col.title}</h4>
                                <ul className="space-y-4">
                                    {col.links.map((link, linkIdx) => (
                                        <motion.li 
                                            key={link}
                                            initial={{ opacity: 0, x: -10 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: (colIdx * 0.1) + (linkIdx * 0.05) }}
                                        >
                                            <a 
                                                href="#" 
                                                className="text-sm text-gray-400 font-bold hover:text-primary transition-colors inline-block"
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'translateX(5px)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'translateX(0)';
                                                }}
                                            >
                                                {link}
                                            </a>
                                        </motion.li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>

                    {/* Bottom Bar */}
                    <motion.div 
                        className="pt-10 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                    >
                        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                            © 2026 REVENUE NAVIGATOR • BUILT FOR SCALE
                        </p>
                        <motion.div 
                            className="flex items-center gap-3 px-4 py-2 bg-white border border-gray-100 rounded-full"
                            whileHover={{ scale: 1.05 }}
                        >
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Global Status:</span>
                            <div className="flex items-center gap-1.5">
                                <motion.span 
                                    className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest uppercase">System Operational</span>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </footer>

            {/* Demo Modal */}
            <AnimatePresence>
                {showDemo && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 z-[100]"
                            onClick={() => setShowDemo(false)}
                            style={{ willChange: "opacity" }}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 50 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 50 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
                        >
                            <div className="bg-white border-4 border-foreground max-w-5xl w-full max-h-[90vh] overflow-hidden relative" style={{ boxShadow: "12px 12px 0px 0px hsl(var(--foreground))" }}>
                                {/* Close Button */}
                                <motion.button
                                    onClick={() => setShowDemo(false)}
                                    className="absolute top-4 right-4 z-10 w-10 h-10 bg-red-500 text-white border-2 border-foreground flex items-center justify-center"
                                    style={{ boxShadow: "3px 3px 0px 0px hsl(var(--foreground))" }}
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <X size={20} />
                                </motion.button>

                                {/* Demo Content */}
                                <div className="p-8">
                                    <motion.h2
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-3xl font-black text-foreground mb-6 uppercase tracking-tight"
                                    >
                                        Revenue Navigator <span className="text-primary">Demo</span>
                                    </motion.h2>
                                    
                                    {/* Demo Video/Preview */}
                                    <div className="relative bg-gray-100 border-2 border-foreground aspect-video mb-6 overflow-hidden">
                                        <motion.div
                                            className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.3 }}
                                        >
                                            <motion.div
                                                className="w-20 h-20 bg-primary rounded-full flex items-center justify-center cursor-pointer border-4 border-white"
                                                style={{ boxShadow: "4px 4px 0px 0px hsl(var(--foreground))" }}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                animate={{ scale: [1, 1.1, 1] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            >
                                                <Play size={32} className="text-white ml-1" />
                                            </motion.div>
                                        </motion.div>
                                        
                                        {/* Demo Dashboard Preview */}
                                        <div className="absolute inset-0 p-8 grid grid-cols-3 gap-4 opacity-20">
                                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                                <motion.div
                                                    key={i}
                                                    className="bg-white border-2 border-foreground p-4"
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 0.2, y: 0 }}
                                                    transition={{ delay: i * 0.1 }}
                                                >
                                                    <div className="h-4 bg-gray-300 mb-2" />
                                                    <div className="h-8 bg-primary/20" />
                                                </motion.div>
                                            ))}
                        </div>
                                    </div>

                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                        className="text-center text-foreground/70 font-bold uppercase tracking-wide mb-6"
                                    >
                                        Experience the power of AI-driven revenue intelligence
                                    </motion.p>

                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6 }}
                                        className="flex justify-center gap-4"
                                    >
                                        <motion.div
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <Link
                                                to="/signin"
                                                className="px-8 py-4 bg-primary text-white border-2 border-foreground font-black text-sm uppercase tracking-widest flex items-center gap-3"
                                                style={{ boxShadow: "4px 4px 0px 0px hsl(var(--foreground))" }}
                                            >
                                                Start Free Trial <ArrowRight size={18} />
                                            </Link>
                                        </motion.div>
                                    </motion.div>
                    </div>
                </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
