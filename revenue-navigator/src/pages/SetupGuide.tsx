import { Link } from "react-router-dom";
import { ShieldCheck, ArrowLeft, Mail, Phone, Server, Key, Info } from "lucide-react";

export default function SetupGuide() {
    return (
        <div
            className="min-h-screen bg-white flex flex-col items-center justify-start p-6 overflow-y-auto"
            style={{
                backgroundImage: `
                    linear-gradient(to right, rgba(0,0,0,0.4) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(0,0,0,0.4) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px'
            }}
        >
            <div className="w-full max-w-3xl mt-12 mb-24">
                {/* Navigation */}
                <Link 
                    to="/setup" 
                    className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-white border-2 border-black rounded-lg text-sm font-black uppercase tracking-wider hover:bg-black hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Setup
                </Link>

                {/* Header */}
                <div className="bg-white border-2 border-black rounded-xl p-8 mb-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-primary/10 border-2 border-black rounded-lg flex items-center justify-center">
                            <Info className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-black uppercase tracking-tight leading-none">Configuration Guide</h1>
                            <p className="text-primary text-xs font-bold tracking-[0.2em] transform scale-y-90 uppercase mt-1">System Documentation</p>
                        </div>
                    </div>
                    <p className="text-foreground/70 text-sm font-medium leading-relaxed max-w-2xl mt-4">
                        This guide provides detailed instructions on how to obtain the necessary credentials to complete the Global Synchronization Protocol. All settings are securely encrypted upon entry.
                    </p>
                </div>

                {/* Sections */}
                <div className="space-y-6">
                    {/* Section 1: SMTP Settings */}
                    <div className="bg-white border-2 border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#5F63F2]/5 rounded-bl-[100px] -z-10" />
                        
                        <div className="flex items-start gap-4">
                            <div className="mt-1 p-2 bg-[#5F63F2]/10 rounded border border-[#5F63F2]/20 text-[#5F63F2]">
                                <Server className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-wide text-black mb-3">1. SMTP Host & Port Configuration</h3>
                                <p className="text-sm text-foreground/70 mb-4">The bridge configuration uses standard SMTP protocols to send emails directly from your account.</p>
                                
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="border border-black/20 rounded-lg p-4 bg-gray-50">
                                        <h4 className="text-xs font-black uppercase mb-2 flex items-center gap-2"><Mail className="w-3 h-3"/> Gmail / Workspace</h4>
                                        <div className="space-y-2 font-mono text-xs">
                                            <div className="flex justify-between border-b pb-1">
                                                <span className="text-black/50">Host:</span>
                                                <span className="font-bold">smtp.gmail.com</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-black/50">Port:</span>
                                                <span className="font-bold">587</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="border border-black/20 rounded-lg p-4 bg-gray-50">
                                        <h4 className="text-xs font-black uppercase mb-2 flex items-center gap-2"><Mail className="w-3 h-3"/> Outlook / Office 365</h4>
                                        <div className="space-y-2 font-mono text-xs">
                                            <div className="flex justify-between border-b pb-1">
                                                <span className="text-black/50">Host:</span>
                                                <span className="font-bold">smtp-mail.outlook.com</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-black/50">Port:</span>
                                                <span className="font-bold">587</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: App Password */}
                    <div className="bg-white border-2 border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#5F63F2]/5 rounded-bl-[100px] -z-10" />
                        
                        <div className="flex items-start gap-4">
                            <div className="mt-1 p-2 bg-[#5F63F2]/10 rounded border border-[#5F63F2]/20 text-[#5F63F2]">
                                <Key className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-black uppercase tracking-wide text-black mb-3">2. Generating a Google App Password</h3>
                                <p className="text-sm text-foreground/70 mb-4">Standard account passwords will not work for security reasons. You must generate a dedicated App Password.</p>
                                
                                <div className="space-y-3">
                                    <div className="flex gap-4 items-center bg-gray-50 p-3 rounded border border-black/10">
                                        <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-black">1</div>
                                        <p className="text-sm font-medium">Go to your <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" className="text-[#5F63F2] hover:underline font-bold">Google Account Security</a> settings.</p>
                                    </div>
                                    <div className="flex gap-4 items-center bg-gray-50 p-3 rounded border border-black/10">
                                        <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-black">2</div>
                                        <p className="text-sm font-medium">Ensure <span className="font-bold">2-Step Verification</span> is turned on.</p>
                                    </div>
                                    <div className="flex gap-4 items-center bg-gray-50 p-3 rounded border border-black/10">
                                        <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-black">3</div>
                                        <p className="text-sm font-medium">Search for <span className="font-bold">"App Passwords"</span> in the settings search bar.</p>
                                    </div>
                                    <div className="flex gap-4 items-center bg-gray-50 p-3 rounded border border-black/10">
                                        <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-black">4</div>
                                        <p className="text-sm font-medium">Select "Other" (or create a custom name) and type <span className="font-mono bg-black/10 px-1 rounded">Advisor Bot</span>, then click Generate.</p>
                                    </div>
                                    <div className="flex gap-4 items-center bg-green-50 p-3 rounded border border-green-200">
                                        <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-black">5</div>
                                        <p className="text-sm font-medium text-green-900">Copy the 16-character password block and paste it into the Setup Form.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Master Sync */}
                    <div className="bg-white border-2 border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[100px] -z-10" />
                        
                        <div className="flex items-start gap-4">
                            <div className="mt-1 p-2 bg-primary/10 rounded border border-primary/20 text-primary">
                                <Phone className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black uppercase tracking-wide text-black mb-3">3. Master Account Synchronization</h3>
                                <p className="text-sm text-foreground/70 mb-4 leading-relaxed">
                                    The <span className="font-bold text-black border-b-2 border-primary">Registration Phone</span> and <span className="font-bold text-black border-b-2 border-primary">Registration Email</span> you provide will be immediately mapped across all currently loaded client accounts.
                                </p>
                                <p className="text-sm text-foreground/70 leading-relaxed bg-primary/5 p-4 rounded border-l-4 border-primary">
                                    <span className="font-black uppercase text-xs tracking-wider block mb-1">Why is this required?</span>
                                    This failsafe ensures that when the system attempts to send automated emails or initiate AI voice calls, it routes them to your specified numbers for testing purposes, rather than dialing live clients during setup.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex justify-center">
                    <Link 
                        to="/setup" 
                        className="px-8 py-4 bg-black text-white border-2 border-black rounded-lg text-lg font-black uppercase tracking-wider hover:bg-gray-800 transition-colors shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)] flex items-center gap-3"
                    >
                        Return to Setup <ArrowLeft className="w-5 h-5 rotate-180" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
