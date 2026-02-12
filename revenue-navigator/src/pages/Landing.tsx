import { ArrowRight, Zap, BarChart3, Users, TrendingUp, Shield } from "lucide-react";
import { Link } from "react-router-dom";

export default function Landing() {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-white border-b-4 border-black">
                <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 mb-6">
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
                        </div>

                        <h1 className="text-5xl lg:text-6xl font-black text-black mb-6 uppercase tracking-tight">
                            Navigate Your Revenue
                            <br />
                            <span className="text-indigo-600">With Precision</span>
                        </h1>

                        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto font-medium">
                            AI-powered renewal management and upsell intelligence for modern revenue teams
                        </p>

                        <div className="flex gap-4 justify-center">
                            <Link
                                to="/signin"
                                className="px-8 py-4 bg-black text-white border-2 border-black font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all inline-flex items-center gap-2"
                            >
                                Get Started <ArrowRight className="h-5 w-5" />
                            </Link>
                            <button className="px-8 py-4 bg-white text-black border-2 border-black font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                                Watch Demo
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="max-w-7xl mx-auto px-6 py-16">
                <h2 className="text-3xl font-black text-black mb-12 uppercase text-center">
                    Powerful Features
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { icon: BarChart3, title: "Analytics Dashboard", desc: "Real-time insights into your revenue pipeline", color: "bg-blue-600" },
                        { icon: Users, title: "Account Management", desc: "Track and manage all customer accounts", color: "bg-purple-600" },
                        { icon: TrendingUp, title: "Upsell Intelligence", desc: "AI-powered upsell recommendations", color: "bg-emerald-600" },
                        { icon: Shield, title: "Risk Detection", desc: "Identify at-risk accounts early", color: "bg-red-600" },
                        { icon: Zap, title: "Automated Workflows", desc: "Streamline renewal processes", color: "bg-yellow-600" },
                        { icon: BarChart3, title: "Revenue Forecasting", desc: "Predict future revenue accurately", color: "bg-indigo-600" },
                    ].map((feature, idx) => (
                        <div key={idx} className="p-6 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all">
                            <div className={`h-12 w-12 flex items-center justify-center ${feature.color} border-2 border-black mb-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
                                <feature.icon className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-lg font-black text-black mb-2 uppercase">{feature.title}</h3>
                            <p className="text-gray-600 font-medium">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-black border-t-4 border-black py-16">
                <div className="max-w-4xl mx-auto text-center px-6">
                    <h2 className="text-4xl font-black text-white mb-6 uppercase">
                        Ready to Transform Your Revenue?
                    </h2>
                    <p className="text-xl text-gray-300 mb-8 font-medium">
                        Join leading companies using Revenue Navigator to drive growth
                    </p>
                    <Link
                        to="/signin"
                        className="px-8 py-4 bg-indigo-600 text-white border-2 border-white font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all inline-flex items-center gap-2"
                    >
                        Start Free Trial <ArrowRight className="h-5 w-5" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
