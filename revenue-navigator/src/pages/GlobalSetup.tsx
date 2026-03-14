import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Zap, Mail, ArrowRight, Phone, ShieldCheck, Settings2, Globe, Server, Key, User, AlertTriangle, LogOut } from "lucide-react";
import { useAppSettings, useUpdateAppSettings } from "@/hooks/useSettings";
import { accountsApi } from "@/lib/api/accounts";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function GlobalSetup() {
    const [globalPhone, setGlobalPhone] = useState("+91 1234567890");
    const [globalEmail, setGlobalEmail] = useState("anp@ailifebot.com");
    const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
    const [smtpPort, setSmtpPort] = useState("587");
    const [smtpPassword, setSmtpPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [phoneError, setPhoneError] = useState("");
    
    const navigate = useNavigate();
    const { toast } = useToast();
    const { logout } = useAuth();
    const updateSettings = useUpdateAppSettings();
    const { data: appSettings } = useAppSettings();

    // NOTE: Form intentionally starts blank on every login.
    // Credentials are stored in Supabase but never shown to the next user.

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate phone number format: +91 XXXXXXXXXX (10 digits)
        const phoneRegex = /^\+91 \d{10}$/;
        if (!phoneRegex.test(globalPhone)) {
            setPhoneError("WRITE_IN_FORMAT: +91 1234567890 (10_DIGITS)");
            return;
        }
        setPhoneError("");
        
        setIsLoading(true);
        
        try {
            // Perform global synchronization
            // 1. Bulk update all accounts with new phone and email
            await accountsApi.bulkUpdate({
                primary_contact_phone: globalPhone,
                primary_contact_email: globalEmail
            });

            // 2. Sync app settings with the registration email and SMTP config
            if (appSettings) {
                await updateSettings.mutateAsync({
                    ...appSettings,
                    automation_paused: false,
                    email: {
                        ...appSettings.email,
                        smtpHost: smtpHost || undefined,
                        smtpPort: parseInt(smtpPort) || 587,
                        smtpUsername: globalEmail,
                        smtpPassword: smtpPassword || undefined,
                        fromEmail: globalEmail
                    }
                });
            }

            toast({
                title: "SYSTEM_READY",
                description: "GLOBAL_SYNC_COMPLETED: ACCESS_GRANTED",
            });
            
            navigate("/app");
        } catch (err) {
            console.error("SYNC_FAILURE:", err);
            toast({
                title: "SYSTEM_FAILURE",
                description: "SYNC_PROTOCOL_ERROR: MANUAL_OVERRIDE_REQUIRED",
                variant: "destructive",
            });
            setIsLoading(false);
        }
    };

    const handleClearConfiguration = async () => {
        setIsLoading(true);
        try {
            if (appSettings) {
                // Soft-disable: credentials stay in DB, automation is just paused
                await updateSettings.mutateAsync({
                    ...appSettings,
                    automation_paused: true,
                });
            }
            toast({
                title: "SESSION_ENDED",
                description: "Automation paused. Your credentials remain stored securely in the database.",
            });
            logout();
            navigate("/");
        } catch (error) {
            console.error("Failed to pause automation:", error);
            toast({
                title: "LOGOUT_FAILED",
                description: "Unable to pause automation. Try again.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen bg-white flex items-center justify-center p-4 overflow-hidden"
            style={{
                backgroundImage: `
        <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4 md:p-8 font-sans relative overflow-hidden">
                    linear-gradient(to right, rgba(0,0,0,0.4) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(0,0,0,0.4) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px'
            }}
        >
            <div className="w-full max-w-2xl scale-[0.75] origin-center -translate-y-4 transition-transform py-4">
                {/* Logo & Branding */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-white border-2 border-black rounded-xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <Settings2 className="w-7 h-7 text-[#5F63F2]" />
                        </div>
                        <div className="text-left">
                            <h2 className="text-2xl font-black text-black tracking-tighter leading-none">SYSTEM</h2>
                            <p className="text-[#5F63F2] text-xs font-bold tracking-[0.2em] transform scale-y-90 uppercase">Configuration</p>
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-black uppercase tracking-tight mb-2">GLOBAL_SYNC_PROTOCOL</h1>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black bg-black text-white border-2 border-black rounded-md uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
                        STATUS: AWAITING_SYNCHRONIZATION
                    </div>
                </div>

                {/* Important Warning Alert */}
                <div className="mb-6 border-2 border-amber-500 bg-amber-50 rounded-lg p-4 shadow-[4px_4px_0px_0px_rgba(245,158,11,1)]">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-xs font-black text-amber-800 uppercase tracking-widest mb-1">
                                CRITICAL WARNING: AUTOMATED PIPELINES ACTIVE
                            </h3>
                            <p className="text-xs text-amber-700 font-bold leading-relaxed">
                                This bot will <strong>store your information</strong> and initiate <strong>automated phone calls</strong> and <strong>automated emails</strong> using these credentials.
                                Be sure to <strong>clear your configuration and log out</strong> after usage to prevent unauthorized background activity.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white border-2 border-black rounded-lg p-8 sm:p-10 relative overflow-visible shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Account Parameters */}
                            <div className="space-y-6">
                                <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded text-[9px] font-black uppercase tracking-widest">
                                    Master_Account_Parameters
                                </div>
                                
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-foreground/60">
                                        // REGISTRATION_EMAIL (SYNC_TO_FROM_EMAIL)
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/40" />
                                        <input
                                            type="email"
                                            value={globalEmail}
                                            onChange={(e) => setGlobalEmail(e.target.value)}
                                            placeholder="ANP@AILIFEBOT.COM"
                                            className="w-full pl-12 pr-4 py-4 bg-white border border-black rounded-lg text-sm font-black text-foreground placeholder:text-foreground/30 focus:outline-none focus:bg-primary/5 hover:shadow-md transition-all uppercase"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-foreground/60">
                                        // REGISTRATION_PHONE (SYNC_TO_ALL_ACCOUNTS)
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/40" />
                                        <input
                                            type="tel"
                                            value={globalPhone}
                                            onChange={(e) => {
                                                setGlobalPhone(e.target.value);
                                                if (phoneError) setPhoneError("");
                                            }}
                                            placeholder="+91 1234567890"
                                            className={`w-full pl-12 pr-4 py-4 bg-white border rounded-lg text-sm font-black text-foreground placeholder:text-foreground/30 focus:outline-none focus:bg-primary/5 hover:shadow-md transition-all uppercase ${phoneError ? "border-red-500" : "border-black"}`}
                                            required
                                        />
                                        {phoneError && <p className="mt-1 text-[10px] font-bold text-red-500 uppercase">{phoneError}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* SMTP Parameters */}
                            <div className="space-y-6">
                                <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-[#5F63F2]/10 text-[#5F63F2] border border-[#5F63F2]/20 rounded text-[9px] font-black uppercase tracking-widest">
                                    SMTP_Bridge_Configuration
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-foreground/60">
                                        // SMTP_HOST
                                    </label>
                                    <div className="relative">
                                        <Server className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/40" />
                                        <input
                                            type="text"
                                            value={smtpHost}
                                            onChange={(e) => setSmtpHost(e.target.value)}
                                            placeholder="SMTP.GMAIL.COM"
                                            className="w-full pl-12 pr-4 py-4 bg-white border border-black rounded-lg text-sm font-black text-foreground placeholder:text-foreground/30 focus:outline-none focus:bg-primary/5 hover:shadow-md transition-all uppercase"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-foreground/60">
                                            // SMTP_PORT
                                        </label>
                                        <div className="relative">
                                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/40" />
                                            <input
                                                type="number"
                                                value={smtpPort}
                                                onChange={(e) => setSmtpPort(e.target.value)}
                                                placeholder="587"
                                                className="w-full pl-12 pr-4 py-4 bg-white border border-black rounded-lg text-sm font-black text-foreground placeholder:text-foreground/30 focus:outline-none focus:bg-primary/5 hover:shadow-md transition-all uppercase"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-foreground/60">
                                            // SMTP_PASSWORD
                                        </label>
                                        <div className="relative">
                                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground/40" />
                                            <input
                                                type="password"
                                                value={smtpPassword}
                                                onChange={(e) => setSmtpPassword(e.target.value)}
                                                placeholder="••••••••••••••••"
                                                className="w-full pl-12 pr-4 py-4 bg-white border border-black rounded-lg text-sm font-black text-foreground placeholder:text-foreground/30 focus:outline-none focus:bg-primary/5 hover:shadow-md transition-all"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            {/* Initialize Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`flex-1 px-6 py-5 bg-black text-white border border-black rounded-lg flex items-center justify-center gap-3 text-lg font-black uppercase tracking-wider hover:shadow-md transition-all group ${isLoading ? "opacity-70 cursor-wait" : ""}`}
                            >
                                {isLoading ? "SYNCHRONIZING_RECORDS..." : (
                                    <>
                                        INITIALIZE_SYSTEM_LOAD
                                        <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
                                    </>
                                )}
                            </button>

                            {/* Clear Config / Logout Button */}
                            <button
                                type="button"
                                onClick={handleClearConfiguration}
                                disabled={isLoading}
                                className="px-6 py-5 bg-white text-red-600 border-2 border-red-600 flex items-center justify-center gap-2 rounded-lg font-black uppercase tracking-widest hover:bg-red-50 hover:shadow-[4px_4px_0px_0px_rgba(220,38,38,0.5)] transition-all"
                                title="CLEAR CONFIGURATION &amp; LOGOUT"
                            >
                                <LogOut className="w-6 h-6" />
                            </button>
                        </div>
                    </form>

                    {/* Documentation Link */}
                    <div className="mt-8 pt-6 border-t border-black flex flex-col items-center justify-center gap-4">
                        <Link 
                            to="/setup/guide"
                            className="w-full flex items-center justify-between p-4 bg-primary/5 hover:bg-primary/10 border border-primary/20 hover:border-primary/40 rounded-lg transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-md border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-[1px] group-hover:translate-y-[1px] transition-all">
                                    <ShieldCheck className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-black uppercase tracking-wider">Configuration Guide</h4>
                                    <p className="text-[10px] text-foreground/60 uppercase tracking-widest mt-0.5">Need help setting up?</p>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    <div className="mt-6 flex flex-col items-center justify-center gap-4">
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={14} className="text-primary" />
                            <p className="text-[10px] font-black text-foreground/60 uppercase tracking-widest">RSA_4096_GCM: SYSTEM_READY</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">
                        v4.2.0 // MASTER_CONFIG_LOADER
                    </p>
                </div>
            </div>
        </div>
    );
}
