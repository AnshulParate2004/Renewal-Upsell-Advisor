import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Phone, Key, Info, MessageSquare } from "lucide-react";

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

                    {/* Section 1: SendGrid API Key */}
                    <div className="bg-white border-2 border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[#5F63F2]/5 rounded-bl-[100px] -z-10" />

                        <div className="flex items-start gap-4">
                            <div className="mt-1 p-2 bg-[#5F63F2]/10 rounded border border-[#5F63F2]/20 text-[#5F63F2]">
                                <Key className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-black uppercase tracking-wide text-black mb-3">1. Generating a SendGrid API Key</h3>
                                <p className="text-sm text-foreground/70 mb-4">The bridge configuration uses SendGrid to safely and reliably deliver emails on behalf of the application.</p>

                                <div className="space-y-3">
                                    <div className="flex gap-4 items-center bg-gray-50 p-3 rounded border border-black/10">
                                        <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-black shrink-0">1</div>
                                        <p className="text-sm font-medium">Create a free account at <a href="https://sendgrid.com" target="_blank" rel="noreferrer" className="text-[#5F63F2] hover:underline font-bold">SendGrid</a>.</p>
                                    </div>
                                    <div className="flex gap-4 items-center bg-gray-50 p-3 rounded border border-black/10">
                                        <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-black shrink-0">2</div>
                                        <p className="text-sm font-medium">Navigate to <span className="font-bold">Settings → Sender Authentication</span> and click <span className="font-bold">Verify a Single Sender</span>.</p>
                                    </div>
                                    <div className="flex gap-4 items-center bg-gray-50 p-3 rounded border border-black/10">
                                        <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-black shrink-0">3</div>
                                        <p className="text-sm font-medium">Enter your details and click Create. <span className="font-bold text-red-600">You must check your inbox and click the verification link they send you!</span></p>
                                    </div>
                                    <div className="flex gap-4 items-center bg-gray-50 p-3 rounded border border-black/10">
                                        <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-black shrink-0">4</div>
                                        <p className="text-sm font-medium">Navigate to <span className="font-bold">Settings → API Keys</span> and click <span className="font-bold">Create API Key</span>.</p>
                                    </div>
                                    <div className="flex gap-4 items-center bg-green-50 p-3 rounded border border-green-200">
                                        <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-black shrink-0">5</div>
                                        <p className="text-sm font-medium text-green-900">Name it, give it <span className="font-bold">Full Access</span>, and copy the key (starts with <code className="font-mono bg-green-100 px-1 py-0.5 rounded">SG.</code>) into the Setup Form.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Twilio Voice & WhatsApp */}
                    <div className="bg-white border-2 border-black rounded-xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-bl-[100px] -z-10" />

                        <div className="flex items-start gap-4">
                            <div className="mt-1 p-2 bg-green-100 rounded border border-green-200 text-green-700">
                                <Phone className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-black uppercase tracking-wide text-black mb-1">2. Twilio — Voice Calls & WhatsApp</h3>
                                <p className="text-sm text-foreground/70 mb-4">Twilio powers the automated AI voice calls and WhatsApp messages sent to clients. You need an Account SID, Auth Token, a voice phone number, and a WhatsApp number.</p>

                                {/* 2a. Account SID + Auth Token */}
                                <div className="mb-5">
                                    <p className="text-xs font-black uppercase tracking-widest text-black mb-3 flex items-center gap-2">
                                        <Key className="w-3.5 h-3.5" /> Getting Your Account SID &amp; Auth Token
                                    </p>
                                    <div className="space-y-3">
                                        <div className="flex gap-4 items-center bg-gray-50 p-3 rounded border border-black/10">
                                            <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-black shrink-0">1</div>
                                            <p className="text-sm font-medium">Sign up or log in at <a href="https://www.twilio.com/console" target="_blank" rel="noreferrer" className="text-green-700 hover:underline font-bold">twilio.com/console</a>.</p>
                                        </div>
                                        <div className="flex gap-4 items-center bg-gray-50 p-3 rounded border border-black/10">
                                            <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-black shrink-0">2</div>
                                            <p className="text-sm font-medium">On the <span className="font-bold">Dashboard</span>, your <code className="font-mono bg-gray-200 px-1 rounded text-xs">Account SID</code> (starts with <code className="font-mono bg-gray-200 px-1 rounded text-xs">AC</code>) and <code className="font-mono bg-gray-200 px-1 rounded text-xs">Auth Token</code> are shown in the Account Info panel.</p>
                                        </div>
                                        <div className="flex gap-4 items-center bg-green-50 p-3 rounded border border-green-200">
                                            <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-black shrink-0">3</div>
                                            <p className="text-sm font-medium text-green-900">Click the <span className="font-bold">eye icon</span> next to Auth Token to reveal it, then copy both values into the Setup Form.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* 2b. Voice Phone Number */}
                                <div className="mb-5">
                                    <p className="text-xs font-black uppercase tracking-widest text-black mb-3 flex items-center gap-2">
                                        <Phone className="w-3.5 h-3.5" /> Getting a Twilio Voice Phone Number
                                    </p>
                                    <div className="space-y-3">
                                        <div className="flex gap-4 items-center bg-gray-50 p-3 rounded border border-black/10">
                                            <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-black shrink-0">1</div>
                                            <p className="text-sm font-medium">In the Twilio Console, go to <span className="font-bold">Phone Numbers → Manage → Buy a number</span>.</p>
                                        </div>
                                        <div className="flex gap-4 items-center bg-gray-50 p-3 rounded border border-black/10">
                                            <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-black shrink-0">2</div>
                                            <p className="text-sm font-medium">Filter by capability: ensure <span className="font-bold">Voice</span> is checked. Search for a number and click <span className="font-bold">Buy</span>.</p>
                                        </div>
                                        <div className="flex gap-4 items-center bg-green-50 p-3 rounded border border-green-200">
                                            <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-black shrink-0">3</div>
                                            <p className="text-sm font-medium text-green-900">Copy the number in <span className="font-bold">E.164 format</span> (e.g. <code className="font-mono bg-green-100 px-1 rounded text-xs">+11111111</code>) and paste it in the <span className="font-bold">Voice Phone Number</span> field.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* 2c. WhatsApp Sandbox */}
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-black mb-3 flex items-center gap-2">
                                        <MessageSquare className="w-3.5 h-3.5" /> Setting Up WhatsApp (Sandbox)
                                    </p>
                                    <div className="space-y-3">
                                        <div className="flex gap-4 items-center bg-gray-50 p-3 rounded border border-black/10">
                                            <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-black shrink-0">1</div>
                                            <p className="text-sm font-medium">Go to <span className="font-bold">Messaging → Try it out → Send a WhatsApp message</span> in the Twilio Console.</p>
                                        </div>
                                        <div className="flex gap-4 items-center bg-gray-50 p-3 rounded border border-black/10">
                                            <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-black shrink-0">2</div>
                                            <p className="text-sm font-medium">The sandbox number shown on that page (e.g. <code className="font-mono bg-gray-200 px-1 rounded text-xs">+1411111111</code>) is your <span className="font-bold">WhatsApp Number</span>.</p>
                                        </div>
                                        <div className="flex gap-4 items-center bg-gray-50 p-3 rounded border border-black/10">
                                            <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-black shrink-0">3</div>
                                            <p className="text-sm font-medium">Activate the sandbox by sending the shown join-code from your WhatsApp to that number (one-time setup per device).</p>
                                        </div>
                                        <div className="flex gap-4 items-center bg-green-50 p-3 rounded border border-green-200">
                                            <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-black shrink-0">4</div>
                                            <p className="text-sm font-medium text-green-900">Paste the sandbox number in <span className="font-bold">E.164 format</span> into the <span className="font-bold">WhatsApp Number</span> field in Setup. For production use, apply for a WhatsApp Business number through Twilio.</p>
                                        </div>
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
                                <Mail className="w-5 h-5" />
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
