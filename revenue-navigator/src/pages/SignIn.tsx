import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";

export default function SignIn() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate auth
        setTimeout(() => {
            console.log("Sign in:", { email, password });
            navigate("/app");
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-background bg-grid flex items-center justify-center p-6 font-display">
            <div className="w-full max-w-lg">
                {/* Logo & Branding */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-4 mb-8">
                        <div className="h-16 w-16 flex items-center justify-center bg-primary border-4 border-foreground shadow-[6px_6px_0px_0px_hsl(var(--foreground))]">
                            <Zap className="h-8 w-8 text-white fill-white" />
                        </div>
                        <div className="flex flex-col items-start leading-none uppercase italic">
                            <span className="text-4xl font-black text-foreground tracking-tighter">
                                REVENUE
                            </span>
                            <span className="text-xl font-black text-primary tracking-widest mt-1">
                                NAVIGATOR
                            </span>
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-foreground uppercase tracking-tight italic mb-3">ACCESS_PORTAL_V4</h1>
                    <div className="sticker-outline inline-block">AUTH_MODE: ZERO_TRUST_ENCRYPTION</div>
                </div>

                {/* Sign In Form */}
                <div className="paper-card bg-white p-10 relative overflow-visible">
                    <div className="absolute -top-4 left-0 w-full h-8 bg-primary border-4 border-foreground z-20"></div>

                    <form onSubmit={handleSubmit} className="space-y-8 mt-6">
                        {/* Email Input */}
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">
                                // IDENTITY_URI
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/40" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="OPERATOR@SYSTEM.COM"
                                    className="w-full pl-12 pr-4 py-4 bg-white border-4 border-foreground text-sm font-black text-foreground placeholder:text-foreground/10 focus:outline-none focus:bg-primary/5 shadow-[4px_4px_0px_0px_hsl(var(--foreground))] focus:shadow-none focus:translate-x-1 focus:translate-y-1 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">
                                // CRYPTOGRAPHIC_KEY
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/40" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-4 py-4 bg-white border-4 border-foreground text-sm font-black text-foreground placeholder:text-foreground/10 focus:outline-none focus:bg-primary/5 shadow-[4px_4px_0px_0px_hsl(var(--foreground))] focus:shadow-none focus:translate-x-1 focus:translate-y-1 transition-all"
                                    required
                                />
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
                                    <div className="w-5 h-5 border-2 border-foreground bg-white peer-checked:bg-primary transition-colors"></div>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">Persist_Session</span>
                            </label>
                            <button type="button" className="text-[10px] font-black uppercase tracking-widest text-accent hover:underline">
                                Recover_Access
                            </button>
                        </div>

                        {/* Sign In Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full btn-punch bg-foreground text-white py-5 flex items-center justify-center gap-3 text-lg group ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
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
                    <div className="relative my-10 flex items-center gap-4">
                        <div className="flex-1 h-[2px] bg-foreground/5"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">EXT_BRIDGE_PROTOCOL</span>
                        <div className="flex-1 h-[2px] bg-foreground/5"></div>
                    </div>

                    {/* Social Sign In */}
                    <div className="grid grid-cols-2 gap-4">
                        <button className="btn-punch bg-white text-sm py-3">GOOGLE_API</button>
                        <button className="btn-punch bg-white text-sm py-3">AUTH_O_FED</button>
                    </div>

                    <div className="mt-10 pt-6 border-t-2 border-foreground/5 flex items-center justify-center gap-2">
                        <ShieldCheck size={14} className="text-primary" />
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">ENCRYPTED_PATH: RSA_4096_GCM</p>
                    </div>
                </div>

                {/* Sign Up Link */}
                <div className="text-center mt-12 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        NULL_ACCOUNT_RECORD?{" "}
                        <Link to="/signup" className="text-primary hover:underline">
                            Request_Credentials
                        </Link>
                    </p>
                    <Link to="/" className="inline-block text-[10px] font-black uppercase tracking-widest text-foreground/40 hover:text-foreground transition-colors">
                        ← RETURN_TO_ROOT_DOMAIN
                    </Link>
                </div>
            </div>
        </div>
    );
}
