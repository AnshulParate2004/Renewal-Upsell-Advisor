import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, Mail, Lock, ArrowRight, Eye, EyeOff, ShieldCheck, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function SignIn() {
    const [email, setEmail] = useState("anp@ailifebot.com");
    const [password, setPassword] = useState("1234");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        
        try {
            const success = await login(email, password);
            if (success) {
                navigate("/setup");
            } else {
                setError("INVALID_IDENTITY_OR_KEY: ACCESS_DENIED");
                setIsLoading(false);
            }
        } catch (err) {
            setError("SYSTEM_FAILURE: AUTH_PROTOCOL_ERROR");
            setIsLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen bg-white flex items-center justify-center p-4 overflow-hidden"
            style={{
                backgroundImage: `
                    linear-gradient(to right, rgba(0,0,0,0.4) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(0,0,0,0.4) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px'
            }}
        >
            <div className="w-full max-w-lg scale-[0.75] origin-center -translate-y-12 transition-transform py-2">
                {/* Logo & Branding */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-white border-2 border-black rounded-xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <Zap className="w-7 h-7 text-[#5F63F2] fill-[#5F63F2]" />
                        </div>
                        <div className="text-left">
                            <h2 className="text-2xl font-black text-black tracking-tighter leading-none">REVENUE</h2>
                            <p className="text-[#5F63F2] text-xs font-bold tracking-[0.2em] transform scale-y-90 uppercase">Navigator</p>
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-black uppercase tracking-tight mb-3">ACCESS_PORTAL_V4</h1>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black bg-black text-white border-2 border-black rounded-md uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
                        AUTH_MODE: ZERO_TRUST_ENCRYPTION
                    </div>
                </div>

                <div className="bg-white border-2 border-black rounded-lg p-8 sm:p-10 relative overflow-visible shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-lg flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2 duration-300">
                            <AlertCircle className="shrink-0" size={18} />
                            <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email Input */}
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-foreground/60">
                                // IDENTITY_URI
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/40" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="OPERATOR@SYSTEM.COM"
                                    className="w-full pl-12 pr-4 py-4 bg-white border border-black rounded-lg text-sm font-black text-foreground placeholder:text-foreground/30 focus:outline-none focus:bg-primary/5 hover:shadow-md transition-all uppercase"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-foreground/60">
                                // CRYPTOGRAPHIC_KEY
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/40" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-12 py-4 bg-white border border-black rounded-lg text-sm font-black text-foreground placeholder:text-foreground/30 focus:outline-none focus:bg-primary/5 hover:shadow-md transition-all"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="peer sr-only"
                                    />
                                    <div className="w-5 h-5 border border-black bg-white peer-checked:bg-primary peer-checked:border-primary transition-colors rounded"></div>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">PERSIST_SESSION</span>
                            </label>
                            <button type="button" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                                RECOVER_ACCESS
                            </button>
                        </div>

                        {/* Sign In Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full px-6 py-5 bg-black text-white border border-black rounded-lg flex items-center justify-center gap-3 text-lg font-black uppercase tracking-wider hover:shadow-md transition-all group ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
                        >
                            {isLoading ? 'INITIALIZING_LINK...' : (
                                <>
                                    INITIALIZE_SESSION
                                    <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-8 flex items-center gap-4">
                        <div className="flex-1 h-[1px] bg-black/20"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground/60 whitespace-nowrap">EXT_BRIDGE_PROTOCOL</span>
                        <div className="flex-1 h-[1px] bg-black/20"></div>
                    </div>

                    {/* Social Sign In */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            className="px-4 py-3 bg-white text-foreground border border-black rounded-lg text-sm font-black uppercase tracking-wider hover:shadow-md transition-all"
                        >
                            GOOGLE_API
                        </button>
                        <button
                            type="button"
                            className="px-4 py-3 bg-white text-foreground border border-black rounded-lg text-sm font-black uppercase tracking-wider hover:shadow-md transition-all"
                        >
                            AUTH_O_FED
                        </button>
                    </div>

                    <div className="mt-8 pt-6 border-t border-black flex flex-col items-center justify-center gap-4">
                        <div className="p-3 bg-primary/5 border-2 border-dashed border-primary/20 rounded-xl w-full text-center">
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Demo Access Credentials</p>
                            <p className="text-xs font-black text-foreground tracking-wide">Username: <span className="text-primary select-all lowercase">anp@ailifebot.com</span></p>
                            <p className="text-xs font-black text-foreground tracking-wide">Password: <span className="text-primary select-all">1234</span></p>
                        </div>
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={14} className="text-primary" />
                            <p className="text-[10px] font-black text-foreground/60 uppercase tracking-widest">ENCRYPTED_PATH: RSA_4096_GCM</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 text-center space-y-4">
                    <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">
                        NULL_ACCOUNT_RECORD? <a href="#" className="text-[#5F63F2] hover:underline transition-all">REQUEST_CREDENTIALS</a>
                    </p>
                    <div className="flex justify-center items-center gap-4 text-[10px] font-black text-black/20 uppercase tracking-[0.2em]">
                        <span className="w-8 h-px bg-black/10" />
                        <Link to="/" className="hover:text-black transition-colors">RETURN_TO_ROOT_DOMAIN</Link>
                        <span className="w-8 h-px bg-black/10" />
                    </div>
                </div>
            </div>
        </div>
    );
}
