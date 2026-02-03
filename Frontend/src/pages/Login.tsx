import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';

export default function Login() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '' });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            localStorage.setItem('isAuthenticated', 'true');
            setIsLoading(false);
            navigate('/dashboard');
        }, 1500);
    };

    return (
        <div className="min-h-screen flex bg-background">
            {/* Left Side - Visual */}
            <div className="hidden lg:flex w-1/2 bg-secondary/30 relative overflow-hidden items-center justify-center p-12">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-blue-600/20" />
                <div className="relative z-10 max-w-lg">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h2 className="text-4xl font-bold mb-6">Welcome Back to RevIQ</h2>
                        <p className="text-lg text-muted-foreground mb-8">
                            Your AI-powered command center for customer success. Monitor renewal risks, discover upsells, and close deals faster.
                        </p>

                        <div className="grid gap-4">
                            <div className="p-4 rounded-xl bg-background/50 backdrop-blur border border-white/5 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 font-bold">94%</div>
                                <div>
                                    <div className="font-semibold">Churn Prediction Accuracy</div>
                                    <div className="text-xs text-muted-foreground">Based on historical data analysis</div>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-background/50 backdrop-blur border border-white/5 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold">$2M+</div>
                                <div>
                                    <div className="font-semibold">Revenue Saved</div>
                                    <div className="text-xs text-muted-foreground">Across all enterprise accounts</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="max-w-md w-full">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center mb-10"
                    >
                        <div className="w-12 h-12 bg-primary rounded-xl mx-auto mb-4 flex items-center justify-center text-primary-foreground font-bold text-xl">
                            R
                        </div>
                        <h1 className="text-3xl font-bold">Sign in to your account</h1>
                        <p className="text-muted-foreground mt-2">Enter your credentials to continue</p>
                    </motion.div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border/50 focus:ring-2 focus:ring-primary/50 focus:border-transparent outline-none transition-all"
                                    placeholder="name@company.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary/50 border border-border/50 focus:ring-2 focus:ring-primary/50 focus:border-transparent outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="rounded border-border bg-secondary/50 text-primary focus:ring-primary/50" />
                                <span>Remember me</span>
                            </label>
                            <a href="#" className="text-primary hover:underline">Forgot password?</a>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Sign In <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground mt-8">
                        Don't have an account? <a href="#" className="text-primary hover:underline font-medium">Contact Sales</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
