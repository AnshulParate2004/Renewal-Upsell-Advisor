import { ArrowRight, Zap, BarChart3, Users, TrendingUp, Shield, Target, Bell, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Landing() {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-white border-b-4 border-black">
                <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
                    <div className="text-center">
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                            className="inline-flex items-center gap-2 mb-6"
                        >
                            <div className="h-12 w-12 flex items-center justify-center bg-indigo-600 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <Zap className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="text-2xl font-black text-black tracking-tight uppercase leading-tight">
                                    Revenue
                                </span>
                                <span className="text-sm font-bold text-indigo-600 tracking-wider uppercase leading-tight">
                                    Navigator
                                </span>
                            </div>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="text-5xl lg:text-6xl font-black text-black mb-6 uppercase tracking-tight"
                        >
                            Navigate Your Revenue
                            <br />
                            <span className="text-indigo-600">With Precision</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.6 }}
                            className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto font-medium"
                        >
                            AI-powered renewal management and upsell intelligence for modern revenue teams.
                            Predict churn, identify opportunities, and automate outreach—all in one platform.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7, duration: 0.6 }}
                            className="flex gap-4 justify-center"
                        >
                            <Link
                                to="/signin"
                                className="px-8 py-4 bg-black text-white border-2 border-black font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all inline-flex items-center gap-2"
                            >
                                Get Started <ArrowRight className="h-5 w-5" />
                            </Link>
                            <button className="px-8 py-4 bg-white text-black border-2 border-black font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                                Watch Demo
                            </button>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* How It Works Section */}
            <div className="bg-gradient-to-b from-indigo-50 to-white py-16 border-b-4 border-black">
                <div className="max-w-7xl mx-auto px-6">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-3xl font-black text-black mb-4 uppercase text-center"
                    >
                        How It Works
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="text-center text-gray-600 mb-12 max-w-3xl mx-auto font-medium"
                    >
                        Revenue Navigator uses AI to analyze your customer data, predict risks, and automate renewal workflows—saving time and increasing revenue.
                    </motion.p>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                            {
                                step: "1",
                                icon: Target,
                                title: "Connect Data",
                                desc: "Integrate with Salesforce, Stripe, and your product analytics",
                                color: "bg-blue-600"
                            },
                            {
                                step: "2",
                                icon: BarChart3,
                                title: "AI Analysis",
                                desc: "ML models predict churn risk, sentiment, and upsell opportunities",
                                color: "bg-purple-600"
                            },
                            {
                                step: "3",
                                icon: Bell,
                                title: "Auto Outreach",
                                desc: "Automated emails and calls at T-90, T-60, T-30 days before renewal",
                                color: "bg-emerald-600"
                            },
                            {
                                step: "4",
                                icon: CheckCircle,
                                title: "Close Deals",
                                desc: "Track outcomes, update CRM, and optimize your renewal strategy",
                                color: "bg-indigo-600"
                            },
                        ].map((step, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.15, duration: 0.5 }}
                                whileHover={{ y: -8, scale: 1.02 }}
                                className="relative p-6 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                            >
                                <div className="absolute -top-4 -left-4 h-10 w-10 flex items-center justify-center bg-black border-2 border-black text-white font-black text-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    {step.step}
                                </div>
                                <div className={`h-12 w-12 flex items-center justify-center ${step.color} border-2 border-black mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                                    <step.icon className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="text-lg font-black text-black mb-2 uppercase">{step.title}</h3>
                                <p className="text-gray-600 font-medium text-sm">{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="max-w-7xl mx-auto px-6 py-16">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-3xl font-black text-black mb-12 uppercase text-center"
                >
                    Powerful Features
                </motion.h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { icon: BarChart3, title: "Analytics Dashboard", desc: "Real-time insights into your revenue pipeline", color: "bg-blue-600" },
                        { icon: Users, title: "Account Management", desc: "Track and manage all customer accounts", color: "bg-purple-600" },
                        { icon: TrendingUp, title: "Upsell Intelligence", desc: "AI-powered upsell recommendations", color: "bg-emerald-600" },
                        { icon: Shield, title: "Risk Detection", desc: "Identify at-risk accounts early", color: "bg-red-600" },
                        { icon: Zap, title: "Automated Workflows", desc: "Streamline renewal processes", color: "bg-yellow-600" },
                        { icon: BarChart3, title: "Revenue Forecasting", desc: "Predict future revenue accurately", color: "bg-indigo-600" },
                    ].map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1, duration: 0.4 }}
                            whileHover={{ y: -6, scale: 1.02 }}
                            className="p-6 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                        >
                            <motion.div
                                whileHover={{ rotate: 360 }}
                                transition={{ duration: 0.6 }}
                                className={`h-12 w-12 flex items-center justify-center ${feature.color} border-2 border-black mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
                            >
                                <feature.icon className="h-6 w-6 text-white" />
                            </motion.div>
                            <h3 className="text-lg font-black text-black mb-2 uppercase">{feature.title}</h3>
                            <p className="text-gray-600 font-medium">{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-black border-t-4 border-black py-16">
                <div className="max-w-4xl mx-auto text-center px-6">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-4xl font-black text-white mb-6 uppercase"
                    >
                        Ready to Transform Your Revenue?
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        className="text-xl text-gray-300 mb-8 font-medium"
                    >
                        Join leading companies using Revenue Navigator to drive growth
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                    >
                        <Link
                            to="/signin"
                            className="px-8 py-4 bg-indigo-600 text-white border-2 border-white font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all inline-flex items-center gap-2"
                        >
                            Start Free Trial <ArrowRight className="h-5 w-5" />
                        </Link>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
