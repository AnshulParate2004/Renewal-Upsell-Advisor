import { AccountActivity } from '@/data/mockData';
import { Phone, Mail, Users, Ticket, FileEdit, TrendingUp, TrendingDown, DollarSign, X, Loader2, MessageCircle } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { voiceApi, type VoiceCallDetail } from '@/lib/api/voice';
import { emailApi } from '@/lib/api/email';
import { whatsappApi } from '@/lib/api/whatsapp';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ActivityTimelineProps {
    accountId?: string;
    activities: AccountActivity[];
}

export default function ActivityTimeline({ accountId, activities }: ActivityTimelineProps) {
    const [filter, setFilter] = useState<string>('all');
    
    // For general mock/DB activities that already have detailed data
    const [selectedActivity, setSelectedActivity] = useState<AccountActivity | null>(null);

    // For dynamic API-fetched activities
    const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
    const [callDetail, setCallDetail] = useState<VoiceCallDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    
    const [selectedEmailThread, setSelectedEmailThread] = useState<any | null>(null);

    const { data: voiceData } = useQuery({
        queryKey: ["voice-calls"],
        queryFn: () => voiceApi.getCalls(0, 500),
        enabled: !!accountId
    });

    const { data: emailDataRes } = useQuery({
        queryKey: ["email-campaigns"],
        queryFn: () => emailApi.getCampaigns(0, 500),
        enabled: !!accountId
    });

    const { data: waDataRes } = useQuery({
        queryKey: ["whatsapp-conversations"],
        queryFn: () => whatsappApi.getConversations(0, 500),
        enabled: !!accountId
    });

    // Process Voice Calls
    const dynamicVoiceCalls = useMemo(() => {
        if (!accountId || !voiceData?.calls) return [];
        return voiceData.calls
            .filter((c) => c.account_id === accountId)
            .map((c) => ({
                id: `dyn-voice-${c.id}`,
                realId: c.id,
                date: c.date,
                type: 'call' as const,
                title: 'Voice Call Completed',
                description: `Duration: ${c.duration}`,
                sentiment: c.sentiment,
                isDynamicVoice: true
            }));
    }, [accountId, voiceData]);

    // Process Emails
    const dynamicEmails = useMemo(() => {
        if (!accountId || !emailDataRes) return [];
        const emailsRaw = (emailDataRes as any)?.campaigns ?? [];
        
        // Group emails by account_id? Actually, we've already fetched all emails and we only want the ones for THIS account.
        // But wait, the API might return multiple DIFFERENT email threads for the same account (if they were started separately).
        // For simplicity, we just group ALL of them into one "Email Thread" since we reverse them.
        const threadMsgs = emailsRaw
            .filter((e: any) => (e.account_id || (e.metadata && e.metadata.account_id)) === accountId)
            .sort((a: any, b: any) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());
        
        if (threadMsgs.length === 0) return [];
        
        const latest = threadMsgs[0];
        
        const inboundReply = threadMsgs.find(
            (m: any) => m.status === 'received' || m.metadata?.direction === 'inbound'
        );
        const _rawIntent1 = inboundReply?.metadata?.detected_intent
            || latest.metadata?.detected_intent
            || 'neutral';
        const rawIntent = typeof _rawIntent1 === 'string' ? _rawIntent1
            : Array.isArray(_rawIntent1) ? String(_rawIntent1[0] ?? 'neutral')
            : String((_rawIntent1 as any)?.intent ?? 'neutral');
            
        let sentimentKey = 'neutral';
        const lowerIntent = rawIntent.toLowerCase();

        if (lowerIntent.includes('positive') || lowerIntent === 'interested' || lowerIntent === 'renewed') {
            sentimentKey = 'positive';
        } else if (lowerIntent.includes('negative') || lowerIntent.includes('churn') || lowerIntent.includes('not_interested') || lowerIntent.includes('no_money')) {
            sentimentKey = 'negative';
        }

        return [{
            id: `dyn-email-${latest.id}`,
            date: latest.sent_at ? new Date(latest.sent_at).toISOString().split('T')[0] : 'Unknown',
            type: 'email' as const,
            title: latest.subject || 'Email Thread',
            description: `${threadMsgs.length} message(s) in thread`,
            sentiment: sentimentKey,
            isDynamicEmail: true,
            threadMsgs: threadMsgs.reverse()
        }];
    }, [accountId, emailDataRes]);

    // Process WhatsApp
    const dynamicWhatsapp = useMemo(() => {
        if (!accountId || !waDataRes) return [];
        const waRaw = (waDataRes as any)?.conversations ?? [];
        
        let threadMsgs = waRaw.filter((e: any) => e.metadata?.account_id === accountId);
        
        // Fallback filter based on phone numbers matching the account could be added,
        // but since we inserted mock data with metadata.account_id, this is sufficient.
        threadMsgs = threadMsgs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            
        if (threadMsgs.length === 0) return [];
        
        const latest = threadMsgs[0];
        
        const inboundReply = threadMsgs.find(
            (m: any) => m.direction === 'user' || m.metadata?.direction === 'inbound'
        );
        const _rawIntent2 = inboundReply?.metadata?.detected_intent
            || latest.metadata?.detected_intent
            || 'neutral';
        const rawIntent2 = typeof _rawIntent2 === 'string' ? _rawIntent2
            : Array.isArray(_rawIntent2) ? String(_rawIntent2[0] ?? 'neutral')
            : String((_rawIntent2 as any)?.intent ?? 'neutral');
            
        let sentimentKey = 'neutral';
        const lowerIntent = rawIntent2.toLowerCase();

        if (lowerIntent.includes('positive') || lowerIntent === 'interested' || lowerIntent === 'renewed') {
            sentimentKey = 'positive';
        } else if (lowerIntent.includes('negative') || lowerIntent.includes('churn') || lowerIntent.includes('not_interested') || lowerIntent.includes('no_money')) {
            sentimentKey = 'negative';
        }

        return [{
            id: `dyn-wa-${latest.id}`,
            date: latest.created_at ? new Date(latest.created_at).toISOString().split('T')[0] : 'Unknown',
            type: 'whatsapp' as any,
            title: 'WhatsApp Conversation',
            description: `${threadMsgs.length} message(s) in thread`,
            sentiment: sentimentKey,
            isDynamicWhatsapp: true,
            threadMsgs: threadMsgs.reverse()
        }];
    }, [accountId, waDataRes]);

    const mergedActivities = useMemo(() => {
        // Filter out any basic DB activities that correspond to dynamic ones to avoid duplicates
        const baseActivities = activities.filter(a => {
           if (a.type === 'call' && dynamicVoiceCalls.length > 0) return false;
           if (a.type === 'email' && dynamicEmails.length > 0) return false;
           return true;
        });
        const all = [...baseActivities, ...dynamicVoiceCalls, ...dynamicEmails, ...dynamicWhatsapp];
        return all.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [activities, dynamicVoiceCalls, dynamicEmails, dynamicWhatsapp]);

    const getIcon = (type: AccountActivity['type'] | 'whatsapp') => {
        switch (type) {
            case 'call': return <Phone size={16} />;
            case 'email': return <Mail size={16} />;
            case 'whatsapp': return <MessageCircle size={16} />;
            case 'meeting': return <Users size={16} />;
            case 'support_ticket': return <Ticket size={16} />;
            case 'contract_change': return <FileEdit size={16} />;
            case 'usage_spike': return <TrendingUp size={16} />;
            case 'usage_drop': return <TrendingDown size={16} />;
            case 'payment': return <DollarSign size={16} />;
            default: return <Mail size={16} />;
        }
    };

    const getTypeColor = (type: AccountActivity['type']) => {
        switch (type) {
            case 'call': return 'bg-blue-600';
            case 'email': return 'bg-purple-600';
            case 'meeting': return 'bg-indigo-600';
            case 'support_ticket': return 'bg-orange-600';
            case 'contract_change': return 'bg-green-600';
            case 'usage_spike': return 'bg-emerald-600';
            case 'usage_drop': return 'bg-red-600';
            case 'payment': return 'bg-teal-600';
            default: return 'bg-gray-600';
        }
    };

    const getSentimentBadge = (sentiment?: 'positive' | 'neutral' | 'negative') => {
        if (!sentiment) return null;
        const colors = {
            positive: 'bg-green-600 text-white',
            neutral: 'bg-gray-400 text-black',
            negative: 'bg-red-600 text-white'
        };
        return (
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 border-2 border-black ${colors[sentiment]} shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]`}>
                {sentiment}
            </span>
        );
    };

    const filteredActivities = filter === 'all'
        ? mergedActivities
        : mergedActivities.filter(a => a.type === filter);

    const activityTypes = ['all', 'call', 'email', 'meeting', 'support_ticket', 'contract_change', 'usage_spike', 'usage_drop', 'payment'];

    const getSentimentCfg = (sentiment?: string, score?: number) => {
        const cat = sentiment || 'neutral';
        const pct = score !== undefined
            ? score > 1 ? Math.round(score) : Math.round(((score + 1) / 2) * 100)
            : cat === "positive" ? 75
            : cat === "negative" ? 25
            : 50;

        switch (cat) {
            case 'positive': return { emoji: "😊", label: "Positive", bar: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-500/10 border-emerald-300", pct };
            case 'negative': return { emoji: "😟", label: "Negative", bar: "bg-red-500", text: "text-red-700", bg: "bg-red-500/10 border-red-300", pct };
            default: return { emoji: "😐", label: "Neutral", bar: "bg-gray-400", text: "text-gray-600", bg: "bg-muted border-gray-300", pct };
        }
    };

    return (
        <div className="w-full">
            {/* Filter Buttons */}
            <div className="mb-4 flex flex-wrap gap-2">
                {activityTypes.map(type => (
                    <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className={`text-[10px] font-black uppercase px-3 py-1.5 border-2 border-black transition-all ${filter === type
                                ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                : 'bg-white text-black hover:bg-gray-100 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                            }`}
                    >
                        {type.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* Timeline */}
            <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-black/20 dark:bg-white/20" />

                {/* Activities */}
                <div className="space-y-4">
                    {filteredActivities.map((activity, idx) => (
                        <div key={activity.id} className="relative pl-14">
                            {/* Icon */}
                            <div className={`absolute left-0 top-1 w-12 h-12 ${getTypeColor(activity.type)} border-2 border-black dark:border-white flex items-center justify-center text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)]`}>
                                {getIcon(activity.type)}
                            </div>

                            {/* Content Card */}
                            <div 
                                onClick={async () => {
                                    if ((activity as any).isDynamicVoice) {
                                        const callId = (activity as any).realId;
                                        setSelectedCallId(callId);
                                        setDetailLoading(true);
                                        try {
                                            const detail = await voiceApi.getById(callId);
                                            setCallDetail(detail);
                                        } catch {
                                            setCallDetail(null);
                                        } finally {
                                            setDetailLoading(false);
                                        }
                                    } else if ((activity as any).isDynamicEmail || (activity as any).isDynamicWhatsapp) {
                                        setSelectedEmailThread((activity as any).threadMsgs);
                                    } else if (activity.transcript || (activity.emails && activity.emails.length > 0)) {
                                        setSelectedActivity(activity);
                                    }
                                }}
                                className={`bg-white dark:bg-gray-800 border-2 border-black dark:border-white p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.3)] transition-all ${((activity as any).isDynamicVoice || (activity as any).isDynamicEmail || (activity as any).isDynamicWhatsapp || activity.transcript || (activity.emails && activity.emails.length > 0)) ? 'cursor-pointer hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]' : ''}`}
                            >
                                <div className="flex items-start justify-between mb-1">
                                    <h4 className="font-black text-sm text-black dark:text-white">{activity.title}</h4>
                                    {getSentimentBadge(activity.sentiment as any)}
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{activity.description}</p>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 dark:text-gray-500">
                                    <span className="uppercase">{activity.type.replace('_', ' ')}</span>
                                    <span>•</span>
                                    <span>{new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    {((activity as any).isDynamicVoice || (activity as any).isDynamicEmail || (activity as any).isDynamicWhatsapp || activity.transcript || (activity.emails && activity.emails.length > 0)) && (
                                        <>
                                            <span>•</span>
                                            <span className="text-primary font-black uppercase tracking-widest">Click to view Details</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {filteredActivities.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 font-bold">
                    No activities found for this filter
                </div>
            )}

            {/* Dialog for Activity Details */}
            <Dialog open={!!selectedActivity} onOpenChange={(open) => !open && setSelectedActivity(null)}>
                <DialogContent className={`max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}>
                    <DialogHeader className="shrink-0">
                        <DialogTitle className="flex items-center justify-between gap-4">
                            <span className="font-black uppercase tracking-tight">
                                {selectedActivity?.type === 'call' ? 'Call Details' : selectedActivity?.type === 'email' || selectedActivity?.type === 'support_ticket' ? 'Message Thread' : 'Activity Details'}
                            </span>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedActivity(null)} className="h-8 w-8 rounded-lg border-2 border-black">
                                <X size={14} />
                            </Button>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col gap-4 overflow-y-auto min-h-0 pb-2">
                        {selectedActivity?.type === 'call' && selectedActivity.transcript && (
                            <div className="space-y-4">
                                <div className="flex gap-2 text-xs text-muted-foreground flex-wrap">
                                    <span className="px-2 py-0.5 rounded-full border-2 border-black bg-muted font-bold text-foreground capitalize">
                                        Completed
                                    </span>
                                    <span className="flex items-center">{selectedActivity.date}</span>
                                </div>

                                {/* Sentiment Analysis Panel */}
                                {(() => {
                                    const cfg = getSentimentCfg(selectedActivity.sentiment, selectedActivity.sentiment_score);
                                    return (
                                        <div className={`rounded-lg border-2 border-black p-4 space-y-3 ${cfg.bg}`}>
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xs font-black uppercase text-muted-foreground tracking-wider">Sentiment Analysis</h3>
                                                <span className={`text-lg font-black ${cfg.text} flex items-center gap-1`}>
                                                    {cfg.emoji} {cfg.label}
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                                                    <span>Negative</span>
                                                    <span>Score: {selectedActivity.sentiment_score !== undefined ? selectedActivity.sentiment_score.toFixed(2) : "—"}</span>
                                                    <span>Positive</span>
                                                </div>
                                                <div className="h-2.5 w-full bg-muted rounded-full border border-black/20 overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all ${cfg.bar}`} style={{ width: `${cfg.pct}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Transcript */}
                                <div>
                                    <h3 className="text-xs font-black uppercase text-muted-foreground mb-1.5">Transcript</h3>
                                    <div className="bg-muted/30 border-2 border-black rounded-lg p-3 max-h-[260px] overflow-y-auto font-mono text-xs whitespace-pre-wrap leading-relaxed">
                                        {selectedActivity.transcript.split('\n').map((line, i) => {
                                            const isAgent = line.trim().startsWith('Agent:');
                                            const isUser = line.trim().startsWith('User:');
                                            return (
                                                <div key={i} className={`mb-1 ${isAgent ? 'text-primary' : isUser ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                                                    {line}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {(selectedActivity?.type === 'email' || selectedActivity?.type === 'support_ticket') && selectedActivity.emails && (
                            <div className="flex flex-col gap-4 bg-muted/20 p-4 rounded-lg flex-1 border-2 border-black/10">
                                {selectedActivity.emails.map((msg) => {
                                    const isUser = msg.sender === 'user';
                                    return (
                                        <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
                                            <div className={`max-w-[85%] border-2 border-black rounded-xl p-4 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${isUser ? 'bg-primary/20' : 'bg-card'}`}>
                                                <div className="flex items-center justify-between gap-6 mb-2">
                                                    <span className="text-[10px] font-bold uppercase text-muted-foreground">{isUser ? "Customer" : "AI Agent / System"}</span>
                                                    <span className="text-[10px] text-muted-foreground">{new Date(msg.date).toLocaleString()}</span>
                                                </div>
                                                <h4 className="font-bold text-sm mb-1">{msg.subject}</h4>
                                                <div className="text-xs text-foreground whitespace-pre-wrap break-words">{msg.body}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Dialog for Dynamic Call Details */}
            <Dialog open={!!selectedCallId} onOpenChange={(open) => !open && setSelectedCallId(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <DialogHeader className="shrink-0">
                        <DialogTitle className="flex items-center justify-between gap-4">
                            <span className="font-black uppercase tracking-tight">Call Details</span>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedCallId(null)} className="h-8 w-8 rounded-lg border-2 border-black">
                                <X size={14} />
                            </Button>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col gap-4 overflow-y-auto min-h-0 pb-2">
                        {detailLoading ? (
                            <div className="flex justify-center p-12">
                                <Loader2 className="w-8 animate-spin text-primary" />
                            </div>
                        ) : callDetail ? (
                            <div className="space-y-4">
                                <div className="flex gap-2 text-xs text-muted-foreground flex-wrap">
                                    <span className="px-2 py-0.5 rounded-full border-2 border-black bg-muted font-bold text-foreground capitalize">
                                        {callDetail.outcome.replace(/_/g, ' ')}
                                    </span>
                                    <span className="flex items-center">{callDetail.date}</span>
                                    {callDetail.duration && callDetail.duration !== "—" && (
                                        <span className="flex items-center">⏱ {callDetail.duration}</span>
                                    )}
                                </div>

                                {/* Sentiment Analysis Panel */}
                                {(() => {
                                    const cfg = getSentimentCfg(callDetail.sentiment_category, callDetail.sentiment_score);
                                    return (
                                        <div className={`rounded-lg border-2 border-black p-4 space-y-3 ${cfg.bg}`}>
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xs font-black uppercase text-muted-foreground tracking-wider">Sentiment Analysis</h3>
                                                <span className={`text-lg font-black ${cfg.text} flex items-center gap-1`}>
                                                    {cfg.emoji} {cfg.label}
                                                </span>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                                                    <span>Negative</span>
                                                    <span>Score: {callDetail.sentiment_score !== undefined ? callDetail.sentiment_score.toFixed(2) : "—"}</span>
                                                    <span>Positive</span>
                                                </div>
                                                <div className="h-2.5 w-full bg-muted rounded-full border border-black/20 overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all ${cfg.bar}`} style={{ width: `${cfg.pct}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Transcript */}
                                <div>
                                    <h3 className="text-xs font-black uppercase text-muted-foreground mb-1.5">Transcript</h3>
                                    <div className="bg-muted/30 border-2 border-black rounded-lg p-3 max-h-[260px] overflow-y-auto font-mono text-xs whitespace-pre-wrap leading-relaxed">
                                        {callDetail.transcript ? callDetail.transcript.split('\n').map((line, i) => {
                                            const isAgent = line.trim().startsWith('Agent:');
                                            const isUser = line.trim().startsWith('User:');
                                            return (
                                                <div key={i} className={`mb-1 ${isAgent ? 'text-primary' : isUser ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                                                    {line}
                                                </div>
                                            );
                                        }) : <span className="text-muted-foreground">No transcript available</span>}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-8">Could not load call details.</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Dialog for Dynamic Email & WhatsApp Thread */}
            <Dialog open={selectedEmailThread !== null} onOpenChange={(open) => !open && setSelectedEmailThread(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <DialogHeader className="shrink-0">
                        <DialogTitle className="flex items-center justify-between gap-4">
                            <span className="font-black uppercase tracking-tight">Communication Thread</span>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedEmailThread(null)} className="h-8 w-8 rounded-lg border-2 border-black">
                                <X size={14} />
                            </Button>
                        </DialogTitle>
                    </DialogHeader>

                    {/* ── Sentiment Summary Panel ── */}
                    {(() => {
                        const msgs = selectedEmailThread ?? [];
                        const inbound = msgs.find((m: any) => m.status === 'received' || m.direction === 'user' || m.metadata?.direction === 'inbound');
                        const sentimentCat = inbound?.metadata?.sentiment_category ?? null;
                        const sentimentScore = inbound?.metadata?.sentiment_score ?? null;
                        const keywords: string[] = inbound?.metadata?.keywords ?? [];
                        if (!sentimentCat) return null;
                        const cfg = getSentimentCfg(sentimentCat, sentimentScore ?? undefined);
                        return (
                            <div className={`mx-1 rounded-lg border-2 border-black p-3 space-y-2 shrink-0 ${cfg.bg}`}>
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Sentiment Analysis</h3>
                                    <span className={`text-base font-black ${cfg.text} flex items-center gap-1`}>
                                        {cfg.emoji} {cfg.label}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                                        <span>Negative</span>
                                        <span>Score: {sentimentScore !== null ? Number(sentimentScore).toFixed(2) : '—'}</span>
                                        <span>Positive</span>
                                    </div>
                                    <div className="h-2.5 w-full bg-muted rounded-full border border-black/20 overflow-hidden">
                                        <div className={`h-full rounded-full transition-all ${cfg.bar}`} style={{ width: `${cfg.pct}%` }} />
                                    </div>
                                </div>
                                {keywords.length > 0 && (
                                    <div className="flex flex-wrap gap-1 pt-1">
                                        {keywords.map((kw: string, i: number) => (
                                            <span key={i} className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-black/10 border border-black/20 rounded">
                                                {kw}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    <div className="flex flex-col gap-3 overflow-y-auto min-h-0 bg-muted/20 p-4 rounded-lg flex-1">
                        {(selectedEmailThread ?? []).length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">No messages in this thread.</p>
                        ) : (
                            (selectedEmailThread ?? []).map((msg: any, idx: number) => {
                                const isUser = msg.status === 'received' || msg.metadata?.direction === 'inbound' || msg.direction === 'user';
                                const bodyText = msg.body || msg.message || msg.text_body || '';
                                return (
                                    <div key={msg.id ?? idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
                                        <div className={`max-w-[85%] border-2 border-black rounded-xl p-4 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${isUser ? 'bg-primary/20' : 'bg-card'}`}>
                                            <div className="flex items-center justify-between gap-4 mb-2">
                                                <span className="text-[10px] font-bold uppercase text-muted-foreground">{isUser ? 'Customer Reply' : 'AI Agent'}</span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {msg.sent_at ? new Date(msg.sent_at).toLocaleString() : msg.created_at ? new Date(msg.created_at).toLocaleString() : ''}
                                                </span>
                                            </div>
                                            {msg.subject && <h4 className="font-bold text-sm mb-1">{msg.subject}</h4>}
                                            {bodyText ? (
                                                <div className="text-xs text-foreground whitespace-pre-wrap break-words">{bodyText}</div>
                                            ) : (
                                                <div className="text-xs text-muted-foreground italic">No message body</div>
                                            )}
                                            {msg.metadata?.detected_intent && (
                                                <div className="mt-2 text-[10px] font-bold uppercase text-primary border-t border-black/10 pt-2">
                                                    Intent: {typeof msg.metadata.detected_intent === 'string'
                                                        ? msg.metadata.detected_intent
                                                        : Array.isArray(msg.metadata.detected_intent)
                                                            ? msg.metadata.detected_intent[0]
                                                            : JSON.stringify(msg.metadata.detected_intent)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
