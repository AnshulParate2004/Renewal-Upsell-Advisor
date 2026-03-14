import { ArrowRight, Zap, BarChart3, TrendingUp, Shield, Target, RefreshCw, Cpu, Play, Sparkles, Activity, DollarSign, User, LogOut, CheckCircle, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useInView, type Variants } from "framer-motion";
import { useState, useRef } from "react";

export default function Landing() {
    const [showDemo, setShowDemo] = useState(false);
    const heroRef = useRef(null);
    const heroInView = useInView(heroRef, { once: true, amount: 0.3 });

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: "easeOut"
            }
        }
    };

    const features = [
        {
            icon: <Target className="w-6 h-6 text-primary" />,
            title: "Churn Prediction",
            description: "AI models flag at-risk accounts 90 days before renewal using usage patterns and engagement signals.",
            badge: "ML-POWERED",
            color: "bg-primary/10",
        },
        {
            icon: <BarChart3 className="w-6 h-6 text-indigo-500" />,
            title: "Expansion Pipeline",
            description: "Surface upsell opportunities automatically based on product adoption and team growth metrics.",
            badge: "REAL-TIME",
            color: "bg-indigo-50",
        },
        {
            icon: <RefreshCw className="w-6 h-6 text-emerald-500" />,
            title: "Auto Outreach",
            description: "Multi-channel campaigns triggered at critical lifecycle moments with personalized messaging.",
            badge: "AUTOMATED",
            color: "bg-emerald-50",
        },
        {
            icon: <Cpu className="w-6 h-6 text-amber-500" />,
            title: "Revenue Intelligence",
            description: "Live dashboards showing pipeline health, renewal forecasts, and expansion metrics synced with your CRM.",
            badge: "AI-DRIVEN",
            color: "bg-amber-50",
        }
    ];

    const stats = [
        { value: "94", label: "Renewal Rate", sublabel: "Avg across customers" },
        { value: "3.2x", label: "Upsell Lift", sublabel: "vs. baseline" },
        { value: "90d", label: "Early Warning", sublabel: "Before churn risk" },
        { value: "< 5min", label: "Time to Insight", sublabel: "From data to action" },
    ];

    return (
        <div className="min-h-screen bg-[#f5f5f4] font-sans selection:bg-primary/20 selection:text-primary">

            {/* Floating Top Navigation - btechverse style */}
            <div className="sticky top-0 z-50 pt-4 pb-3 px-4 md:px-8 bg-[#f5f5f4]/90 backdrop-blur-sm">
                <motion.nav
                    initial={{ y: -80, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="max-w-6xl mx-auto bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] py-3 px-5 md:px-8 flex items-center justify-between gap-4"
                >
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 shrink-0">
                        <div className="h-9 w-9 rounded-xl overflow-hidden flex-shrink-0 relative flex items-center justify-center border border-gray-200">
                            <div className="absolute inset-0 flex flex-col">
                                <div className="h-1/2 bg-primary" />
                                <div className="h-1/2 bg-emerald-500" />
                            </div>
                            <Zap className="relative z-10 w-4 h-4 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900 tracking-tight leading-none">Revenue Navigator</span>
                            <span className="text-[11px] text-gray-400 leading-none mt-0.5">for revenue teams</span>
                        </div>
                    </Link>

                    {/* Center Nav */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link to="/features" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                            Features
                        </Link>
                        <Link to="/pricing" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                            Pricing
                        </Link>
                    </div>

                    {/* Right CTA */}
                    <div className="flex items-center gap-3 shrink-0">
                        <Link to="/signin" className="hidden sm:inline text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                            Sign In
                        </Link>
                        <Link to="/signin"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors">
                            Get Started <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </motion.nav>
            </div>

            {/* Announcement Ticker */}
            <div className="bg-primary overflow-hidden">
                <motion.div
                    initial={{ x: "100%" }}
                    animate={{ x: "-100%" }}
                    transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
                    className="whitespace-nowrap py-2.5 px-8 text-[10px] font-bold uppercase tracking-[0.35em] text-white opacity-90"
                >
                    🚀 AI RENEWAL INTELLIGENCE • MAXIMIZE EVERY UPSELL • ML-POWERED PREDICTIONS • REAL-TIME ANALYTICS • CHURN PREVENTION • AUTOMATED OUTREACH •&nbsp;&nbsp;&nbsp;&nbsp;
                    🚀 AI RENEWAL INTELLIGENCE • MAXIMIZE EVERY UPSELL • ML-POWERED PREDICTIONS • REAL-TIME ANALYTICS • CHURN PREVENTION • AUTOMATED OUTREACH •
                </motion.div>
            </div>

            {/* ───── HERO SECTION ───── */}
            <section ref={heroRef} className="relative py-20 lg:py-32 overflow-hidden">
                {/* Grid background */}
                <div className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `
                            linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)
                        `,
                        backgroundSize: '40px 40px'
                    }}
                />

                <div className="max-w-6xl mx-auto px-6 md:px-8 relative">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left Content */}
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate={heroInView ? "visible" : "hidden"}
                        >
                            {/* Badge */}
                            <motion.div variants={itemVariants}
                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-[11px] font-semibold text-gray-600 mb-6 shadow-sm">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                Revenue Intelligence Platform
                            </motion.div>

                            {/* Heading */}
                            <motion.h1 variants={itemVariants}
                                className="text-5xl lg:text-6xl font-black text-gray-900 mb-6 leading-[1.08] tracking-tight">
                                Never miss a{" "}
                                <span className="text-primary">renewal</span>
                                {" "}again.
                            </motion.h1>

                            {/* Subtext */}
                            <motion.p variants={itemVariants}
                                className="text-lg text-gray-500 mb-8 max-w-lg leading-relaxed font-medium">
                                AI-powered insights that predict churn, identify expansion opportunities, and automate outreach — all in one platform.
                            </motion.p>

                            {/* CTAs */}
                            <motion.div variants={itemVariants} className="flex flex-wrap gap-3 mb-12">
                                <Link to="/signin"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold text-sm hover:bg-gray-800 transition-all hover:shadow-lg">
                                    Get Started Free <ArrowRight className="w-4 h-4" />
                                </Link>
                                <button onClick={() => setShowDemo(true)}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-semibold text-sm hover:border-gray-400 transition-all hover:shadow-sm">
                                    <Play className="w-4 h-4 text-primary fill-primary" />
                                    Watch Demo
                                </button>
                            </motion.div>

                            {/* Social proof */}
                            <motion.div variants={itemVariants} className="flex items-center gap-4 text-sm text-gray-400 font-medium">
                                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" />No credit card required</span>
                                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" />14-day free trial</span>
                            </motion.div>
                        </motion.div>

                        {/* Right — Dashboard Preview */}
                        <motion.div
                            initial={{ opacity: 0, y: 30, scale: 0.97 }}
                            animate={heroInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                            transition={{ delay: 0.35, duration: 0.7, ease: "easeOut" }}
                            className="relative hidden lg:block"
                        >
                            {/* Main dashboard card */}
                            <div className="bg-white rounded-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                                {/* Card header */}
                                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                        Live Dashboard
                                    </div>
                                </div>

                                {/* Metrics row */}
                                <div className="grid grid-cols-3 gap-px bg-gray-100">
                                    {[
                                        { label: "Revenue at Risk", value: "$2.4M", color: "text-red-500", icon: "🚨" },
                                        { label: "Upsell Pipeline", value: "$890K", color: "text-emerald-600", icon: "💰" },
                                        { label: "Renewal Rate", value: "94", color: "text-primary", icon: "📈" },
                                    ].map((m, i) => (
                                        <div key={i} className="bg-white px-5 py-5">
                                            <div className="text-lg mb-1">{m.icon}</div>
                                            <div className={`text-2xl font-black ${m.color} tracking-tight`}>{m.value}</div>
                                            <div className="text-[11px] text-gray-400 font-medium mt-0.5">{m.label}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Risk table */}
                                <div className="px-6 py-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">High Risk Accounts</span>
                                        <span className="text-[10px] px-2 py-0.5 bg-red-50 text-red-600 rounded-full font-semibold">12 accounts</span>
                                    </div>
                                    <div className="space-y-2">
                                        {[
                                            { name: "Acme Corporation", arr: "$450K", risk: 91, days: 23 },
                                            { name: "Stark Industries", arr: "$280K", risk: 78, days: 45 },
                                            { name: "Wayne Enterprises", arr: "$190K", risk: 65, days: 67 },
                                        ].map((acc, i) => (
                                            <motion.div key={i}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={heroInView ? { opacity: 1, x: 0 } : {}}
                                                transition={{ delay: 0.5 + i * 0.1 }}
                                                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all cursor-pointer">
                                                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                                                    <span className="text-xs font-black text-primary">{acc.name[0]}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-bold text-gray-800 truncate">{acc.name}</div>
                                                    <div className="text-[11px] text-gray-400">{acc.arr != null ? acc.arr : '—'} • {acc.days}d to renewal</div>
                                                </div>
                                                <div className="shrink-0 text-right">
                                                    <div className={`text-xs font-black px-2 py-0.5 rounded-full ${acc.risk >= 80 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                                                        {acc.risk} risk
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                {/* AI Alert Badge */}
                                <motion.div
                                    animate={{ y: [0, -4, 0] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute -top-4 -right-4 bg-white border border-gray-200 rounded-2xl shadow-lg px-4 py-3 flex items-center gap-2.5"
                                >
                                    <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                                        <Sparkles className="w-4 h-4 text-primary" />
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-bold text-gray-800">AI Alert</div>
                                        <div className="text-[10px] text-gray-400">Acme renews in 23 days</div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    animate={{ y: [0, 4, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                    className="absolute -bottom-4 -left-4 bg-white border border-gray-200 rounded-2xl shadow-lg px-4 py-3 flex items-center gap-2.5"
                                >
                                    <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center">
                                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-bold text-gray-800 flex items-center gap-1">Upsell Found <span className="text-emerald-600">+$45K</span></div>
                                        <div className="text-[10px] text-gray-400">Stark Industries • License upgrade</div>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ───── STATS STRIP ───── */}
            <section className="bg-white border-y border-gray-100 py-12">
                <div className="max-w-6xl mx-auto px-6 md:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, i) => (
                            <motion.div key={i}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08 }}
                                className="text-center">
                                <div className="text-3xl font-black text-gray-900 tracking-tight">{stat.value}</div>
                                <div className="text-sm font-semibold text-gray-700 mt-1">{stat.label}</div>
                                <div className="text-xs text-gray-400 mt-0.5">{stat.sublabel}</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ───── FEATURES ───── */}
            <section id="features" className="py-24 bg-[#f5f5f4]">
                <div className="max-w-6xl mx-auto px-6 md:px-8">
                    {/* Section badge + heading */}
                    <div className="text-center mb-16">
                        <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="inline-block px-3 py-1 border border-gray-300 rounded-full text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-4 bg-white"
                        >
                            POWERED BY AI
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl font-black text-gray-900 tracking-tight mb-3"
                        >
                            Everything to maximize revenue.
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="text-gray-500 text-base max-w-lg mx-auto font-medium"
                        >
                            From churn signals to expansion plays, Revenue Navigator covers the full customer lifecycle.
                        </motion.p>
                    </div>

                    {/* Feature cards - btechverse grid style */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {features.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.2 }}
                                transition={{ delay: idx * 0.08 }}
                                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                className="bg-white rounded-2xl border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer group"
                            >
                                <div className={`w-11 h-11 ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    {feature.icon}
                                </div>
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{feature.badge}</div>
                                <h3 className="text-base font-bold text-gray-900 mb-2">{feature.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed font-medium">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ───── HOW IT WORKS ───── */}
            <section className="py-24 bg-white border-t border-gray-100">
                <div className="max-w-6xl mx-auto px-6 md:px-8">
                    <div className="text-center mb-16">
                        <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="inline-block px-3 py-1 border border-gray-300 rounded-full text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-4 bg-[#f5f5f4]"
                        >
                            HOW IT WORKS
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl font-black text-gray-900 tracking-tight"
                        >
                            Three steps to revenue clarity.
                        </motion.h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { step: "01", title: "Connect your data", desc: "Sync CRM, product usage, and billing data in minutes. No engineering required.", icon: <Activity className="w-5 h-5 text-primary" /> },
                            { step: "02", title: "AI surfaces insights", desc: "Our models analyze patterns and flag risks, upsells, and renewals automatically.", icon: <Sparkles className="w-5 h-5 text-indigo-500" /> },
                            { step: "03", title: "Take action", desc: "Trigger outreach, assign tasks, and close deals directly from the platform.", icon: <CheckCircle className="w-5 h-5 text-emerald-500" /> },
                        ].map((step, i) => (
                            <motion.div key={i}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.12 }}
                                className="relative"
                            >
                                <div className="bg-white rounded-2xl border-2 border-black p-8 h-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <div className="text-5xl font-black text-gray-100 mb-4 leading-none">{step.step}</div>
                                    <div className="w-9 h-9 bg-white rounded-xl border border-gray-200 flex items-center justify-center mb-4 shadow-sm">
                                        {step.icon}
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed font-medium">{step.desc}</p>
                                </div>
                                {i < 2 && (
                                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 text-gray-300 text-2xl font-light select-none z-10">→</div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ───── SOCIAL PROOF ───── */}
            <section className="py-20 bg-[#f5f5f4] border-t border-gray-100">
                <div className="max-w-6xl mx-auto px-6 md:px-8">
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-10"
                    >
                        Trusted by revenue teams at
                    </motion.p>
                    <div className="flex items-center justify-center gap-12 flex-wrap">
                        {['Salesforce', 'HubSpot', 'Stripe', 'Zendesk', 'Atlassian', 'Intercom', 'Zoom'].map((brand, i) => (
                            <motion.div key={brand}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.07 }}
                                className="text-base font-black text-gray-300 tracking-tight hover:text-gray-600 transition-colors duration-300 cursor-default select-none"
                            >
                                {brand}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ───── CTA ───── */}
            <section className="py-24 bg-white relative overflow-hidden border-t border-gray-100">
                {/* Subtle grid */}
                <div className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `
                            linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)
                        `,
                        backgroundSize: '40px 40px'
                    }}
                />
                {/* Soft glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/8 rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-3xl mx-auto px-6 md:px-8 text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-full text-[11px] font-semibold text-gray-500 mb-6 bg-gray-50">
                            <Bell className="w-3.5 h-3.5 text-primary" /> Start protecting revenue today
                        </div>
                        <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-6 tracking-tight leading-tight">
                            Ready to <span className="text-primary">maximize</span> your revenue?
                        </h2>
                        <p className="text-gray-500 text-base font-medium mb-10 max-w-xl mx-auto">
                            Join hundreds of revenue teams using AI to predict churn, find upsells, and close more renewals.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/signin"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/20">
                                Start Free Trial <ArrowRight className="w-4 h-4" />
                            </Link>
                            <button onClick={() => setShowDemo(true)}
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold text-sm hover:border-gray-400 hover:shadow-sm transition-all">
                                <Play className="w-4 h-4 text-primary fill-primary" /> Watch Demo
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ───── FOOTER ───── */}
            <footer className="bg-[#f5f5f4] py-12 border-t border-gray-200">
                <div className="max-w-6xl mx-auto px-6 md:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200 relative">
                                <div className="absolute inset-0 flex flex-col">
                                    <div className="h-1/2 bg-primary" />
                                    <div className="h-1/2 bg-emerald-500" />
                                </div>
                                <Zap className="relative z-10 w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="text-sm font-bold text-gray-600">Revenue Navigator</span>
                        </div>
                        <div className="flex items-center gap-8 text-sm text-gray-400">
                            {['Privacy', 'Terms', 'Security', 'Status'].map(item => (
                                <a key={item} href="#" className="hover:text-gray-700 transition-colors">{item}</a>
                            ))}
                        </div>
                        <p className="text-sm text-gray-400">© 2025 Revenue Navigator. All rights reserved.</p>
                    </div>
                </div>
            </footer>

            {/* ───── DEMO MODAL ───── */}
            <AnimatePresence>
                {showDemo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                        onClick={() => setShowDemo(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.92, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.92, opacity: 0 }}
                            className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-200"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                    <Play className="w-5 h-5 text-primary fill-primary" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Product Demo</h3>
                            </div>
                            <div className="bg-gray-100 rounded-xl h-48 flex items-center justify-center mb-6 border border-gray-200">
                                <div className="text-center">
                                    <Play className="w-12 h-12 text-gray-300 fill-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-400 font-medium">Demo video placeholder</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Link to="/signin" className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors">
                                    Get Started <ArrowRight className="w-4 h-4" />
                                </Link>
                                <button onClick={() => setShowDemo(false)}
                                    className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors">
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
