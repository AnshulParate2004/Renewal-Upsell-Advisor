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
            {/* Left Side - Brand Visual */}
            <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-black">
                {/* Background Image & Effects */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/assets/login_background_tech.png"
                        alt="Background"
                        className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/90 via-zinc-900/80 to-blue-900/40 mix-blend-multiply" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent" />
                </div>

                {/* Content */}
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <img
                            src="/assets/reviq_logo.png"
                            alt="RevIQ Logo"
                            className="w-12 h-12 object-contain drop-shadow-lg"
                        />
                        <span className="text-2xl font-bold text-white tracking-tight">RevIQ</span>
                    </div>

                    <h1 className="text-4xl font-bold text-white tracking-tight mb-6 leading-tight">
                        Predict Retention. <br />
                        <span className="text-blue-400">Secure Revenue.</span>
                    </h1>
                    <p className="text-lg text-zinc-300 max-w-md leading-relaxed border-l-2 border-primary/50 pl-4">
                        The enterprise intelligence platform that transforms customer data into actionable renewal strategies.
                    </p>
                </div>

                <div className="relative z-10 grid grid-cols-2 gap-6">
                    <div className="p-4 bg-black/40 backdrop-blur-md border-2 border-white/20 hover:border-white/50 transition-colors group">
                        <div className="text-3xl font-mono font-black text-white mb-1 group-hover:scale-105 transition-transform">94%</div>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            <div className="text-[10px] text-zinc-300 uppercase font-bold tracking-wider">Prediction Accuracy</div>
                        </div>
                    </div>
                    <div className="p-4 bg-black/40 backdrop-blur-md border-2 border-white/20 hover:border-white/50 transition-colors group">
                        <div className="text-3xl font-mono font-black text-blue-400 mb-1 group-hover:scale-105 transition-transform">$2.4B</div>
                        <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            <div className="text-[10px] text-zinc-300 uppercase font-bold tracking-wider">Revenue Secured</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white selection:bg-black selection:text-white">
                <div className="max-w-[400px] w-full">
                    <div className="mb-10 text-center">
                        <div className="w-12 h-12 bg-black text-white border-2 border-black flex items-center justify-center font-bold mx-auto mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                            <Lock className="w-6 h-6" />
                        </div>
                        <h2 className="text-3xl font-black text-black uppercase tracking-tighter">Sign In</h2>
                        <p className="text-sm font-bold text-gray-500 mt-2 uppercase tracking-widest">Access Command Center</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-black tracking-widest">Work Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full pl-10 pr-3 py-3 rounded-none border-2 border-black bg-white text-sm font-bold focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all outline-none placeholder:text-gray-300"
                                    placeholder="EXEC@COMPANY.COM"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-black tracking-widest">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full pl-10 pr-3 py-3 rounded-none border-2 border-black bg-white text-sm font-bold focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[-2px] focus:translate-y-[-2px] transition-all outline-none placeholder:text-gray-300"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 rounded-none bg-black text-white text-sm font-black uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:transform-none"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    Authenticate Connection <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t-2 border-black/5 text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Protected by RevIQ Enterprise Security
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
