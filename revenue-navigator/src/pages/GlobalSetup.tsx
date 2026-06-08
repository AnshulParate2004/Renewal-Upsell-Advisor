import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Settings2, AlertTriangle, LogOut } from "lucide-react";
import { getPipelineType } from "@/lib/pipelineConfig";
import { setupApi } from "@/lib/api/settings";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function GlobalSetup() {
    const globalPhone = "+91 1234567890";
    const targetEmail = "anp@ailifebot.com";
    const masterSystemEmail = "billing@yourdomain.com";
    const resendApiKey = "";
    // Twilio Credentials
    const twilioAccountSid = "";
    const twilioAuthToken = "";
    const twilioPhoneNumber = "";
    const twilioWhatsappNumber = "";
    const [pipelineType, setPipelineType] = useState<"zscaler" | "aditya_birla" | "crowdstrike">("zscaler");
    const [isLoading, setIsLoading] = useState(false);
    const [phoneError, setPhoneError] = useState("");
    const navigate = useNavigate();
    const { toast } = useToast();
    const { logout } = useAuth();

    // NOTE: Form intentionally starts blank on every login.
    // Credentials are stored in Supabase but never shown to the next user.

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const storageValue = pipelineType === "adobe" || pipelineType === "aditya_birla"
            ? "aditya_birla"
            : pipelineType;
        localStorage.setItem("pipeline_type", storageValue);

        try {
            await setupApi.saveSetup({
                from_name: "Revenue Navigator",
                automation_paused: false,
                pipeline_type: storageValue,
            });
        } catch {
            // localStorage still drives demo vendor if backend unavailable
        }

        setIsLoading(false);
        navigate("/app");
    };

    const handleClearConfiguration = async () => {
        setIsLoading(true);
        try {
            const { setupApi } = await import('@/lib/api/settings');
            await setupApi.pauseAutomation();

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
                    linear-gradient(to right, rgba(0,0,0,0.4) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(0,0,0,0.4) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px'
            }}
        >
            <div className="w-full max-w-3xl scale-[0.80] origin-center -translate-y-4 transition-transform py-4">
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
                    {/* Integrated Logout Button */}
                    <button
                        type="button"
                        onClick={handleClearConfiguration}
                        disabled={isLoading}
                        className="absolute -top-3 -right-3 w-10 h-10 bg-white text-red-600 border-2 border-black rounded-lg flex items-center justify-center hover:bg-red-50 hover:text-red-700 hover:shadow-[4px_4px_0px_0px_rgba(220,38,38,1)] transition-all z-10"
                        title="CLEAR CONFIGURATION & LOGOUT"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>

                    <form onSubmit={handleSubmit} className="space-y-8">

                        <div className="space-y-4">
                            <label className="text-sm font-black text-black uppercase tracking-wider block text-center mb-2">Select Demo Environment</label>
                            <div className="grid grid-cols-3 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setPipelineType("zscaler")}
                                    className={`p-4 border-2 rounded-lg flex flex-col items-center justify-center gap-2 transition-all ${pipelineType === "zscaler" ? "border-black bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" : "border-gray-200 bg-white text-gray-500 hover:border-black hover:text-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"}`}
                                >
                                    <span className="font-bold text-lg">Zscaler</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPipelineType("aditya_birla")}
                                    className={`p-4 border-2 rounded-lg flex flex-col items-center justify-center gap-2 transition-all ${pipelineType === "aditya_birla" ? "border-black bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" : "border-gray-200 bg-white text-gray-500 hover:border-black hover:text-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"}`}
                                >
                                    <span className="font-bold text-lg">Adobe</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPipelineType("crowdstrike")}
                                    className={`p-4 border-2 rounded-lg flex flex-col items-center justify-center gap-2 transition-all ${pipelineType === "crowdstrike" ? "border-black bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" : "border-gray-200 bg-white text-gray-500 hover:border-black hover:text-black hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"}`}
                                >
                                    <span className="font-bold text-lg">Crowdstrike</span>
                                </button>
                            </div>
                        </div>

                        <div className="bg-emerald-50 border-2 border-emerald-500 rounded-lg p-6 text-center shadow-[4px_4px_0px_0px_rgba(16,185,129,1)]">
                            <h3 className="text-xl font-black text-emerald-800 uppercase tracking-widest mb-2">
                                System Ready
                            </h3>
                            <p className="text-sm text-emerald-700 font-bold">
                                You can proceed to the dashboard by clicking <strong>INITIALIZE_SYSTEM_LOAD</strong>.
                            </p>
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`flex-1 px-6 py-5 bg-black text-white border border-black rounded-lg flex items-center justify-center gap-3 text-lg font-black uppercase tracking-wider hover:shadow-md transition-all group ${isLoading ? "opacity-70 cursor-wait" : ""}`}
                            >
                                    <>
                                        INITIALIZE_SYSTEM_LOAD
                                        <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
                                    </>
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
                        v4.3.0 // MASTER_CONFIG_LOADER
                    </p>
                </div>
            </div>
        </div>
    );
}
