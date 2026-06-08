import { useState, useEffect } from "react";
import { Phone, Mail, MessageCircle, Loader2, Sparkles, Send, Zap, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { voiceApi } from "@/lib/api/voice";
import { emailApi } from "@/lib/api/email";
import { whatsappApi } from "@/lib/api/whatsapp";
import { cn } from "@/lib/utils";
import type { Account } from "@/data/mockData";
import { LIFECYCLE_STAGES } from "@/lib/lifecycleEngine";
import { useActionRecommendation } from "@/hooks/useActionRecommendation";
import type { RecommendedChannel } from "@/types/lifecycle";

type ActionTab = RecommendedChannel;

interface AccountActionBoardProps {
  account: Account;
  initialFocus?: ActionTab;
}

export function AccountActionBoard({ account, initialFocus }: AccountActionBoardProps) {
  const { toast } = useToast();
  const { data: recommendation, isLoading: recLoading, isError: recError } = useActionRecommendation(account.id);

  const [activeTab, setActiveTab] = useState<ActionTab>("call");
  const [purpose, setPurpose] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailHtml, setEmailHtml] = useState<string | null>(null);
  const [messagePreview, setMessagePreview] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const accountId = account.id;
  const accountName = account.name;
  const contactEmail = account.contactEmail;
  const contactPhone = account.contactPhone;

  useEffect(() => {
    if (!recommendation) return;
    setActiveTab(initialFocus ?? recommendation.channel);
    setPurpose(recommendation.action);
  }, [account.id, recommendation?.channel, recommendation?.action, initialFocus]);

  const stageConfig = recommendation ? LIFECYCLE_STAGES.find((s) => s.id === recommendation.stage) : undefined;

  const tabs: { id: ActionTab; label: string; icon: typeof Phone; desc: string }[] = [
    { id: "call", label: "Call", icon: Phone, desc: "Initiate AI voice outreach" },
    { id: "message", label: "Message", icon: MessageCircle, desc: "Send WhatsApp message" },
    { id: "email", label: "Mail", icon: Mail, desc: "Send personalized email" },
  ];

  const notify = (title: string, description: string, variant?: "destructive") => {
    toast({ title, description, variant });
  };

  const handleCall = async () => {
    setLoading("call");
    try {
      await voiceApi.triggerToAccount(accountId, purpose.trim() || undefined);
      notify("Call initiated", `Voice call queued for ${accountName}.`);
    } catch (e) {
      notify("Call failed", e instanceof Error ? e.message : "Could not initiate call.", "destructive");
    } finally {
      setLoading(null);
    }
  };

  const handleEmailPreview = async () => {
    setLoading("email-preview");
    try {
      const preview = await emailApi.getPreview(accountId, purpose.trim() || undefined);
      setEmailSubject(preview.subject ?? "");
      setEmailBody(preview.text_body ?? "");
      setEmailHtml(preview.html_body ?? null);
      notify("Email ready", "Preview generated. Review and send.");
    } catch (e) {
      notify("Preview failed", e instanceof Error ? e.message : "Could not generate email.", "destructive");
    } finally {
      setLoading(null);
    }
  };

  const handleEmailSend = async () => {
    setLoading("email-send");
    try {
      const hasCustom = emailSubject.trim() || emailBody.trim();
      await emailApi.sendToAccount(
        accountId,
        hasCustom
          ? {
              subject: emailSubject.trim() || "Follow-up",
              html_body: emailHtml ?? emailBody.replace(/\n/g, "<br/>"),
              text_body: emailBody,
            }
          : { purpose: purpose.trim() || undefined }
      );
      notify("Email sent", `Message delivered to ${accountName}.`);
    } catch (e) {
      notify("Send failed", e instanceof Error ? e.message : "Could not send email.", "destructive");
    } finally {
      setLoading(null);
    }
  };

  const handleMessagePreview = async () => {
    setLoading("msg-preview");
    try {
      const res = await whatsappApi.generatePreview(accountId, purpose.trim() || "account update");
      setMessagePreview(res.preview ?? "");
      notify("Message ready", "WhatsApp preview generated.");
    } catch (e) {
      notify("Preview failed", e instanceof Error ? e.message : "Could not generate message.", "destructive");
    } finally {
      setLoading(null);
    }
  };

  const handleMessageSend = async () => {
    setLoading("msg-send");
    try {
      await whatsappApi.sendToAccount(accountId, {
        purpose: purpose.trim() || undefined,
        custom_text: messagePreview.trim() || undefined,
      });
      notify("Message sent", `WhatsApp sent to ${accountName}.`);
    } catch (e) {
      notify("Send failed", e instanceof Error ? e.message : "Could not send message.", "destructive");
    } finally {
      setLoading(null);
    }
  };

  const isRecommended = (tab: ActionTab) => recommendation && tab === recommendation.channel;

  if (recError) {
    return (
      <div className="bg-card border-2 border-destructive/40 rounded-xl p-8 text-center">
        <p className="text-sm text-destructive font-medium">Could not load recommendation.</p>
        <p className="text-xs text-muted-foreground mt-1">Ensure the backend is running on port 8000.</p>
      </div>
    );
  }

  if (recLoading || !recommendation) {
    return (
      <div className="bg-card border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-8 flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Loading recommendation from backend…</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-black/10 bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-black/8 bg-muted/30 flex items-center gap-2">
        <Zap className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Action board</h3>
        <span className="text-[11px] text-muted-foreground ml-auto">Recommended next step</span>
      </div>

      <div className="p-5 space-y-4">
        {/* AI Recommendation */}
        <div className="rounded-lg border border-primary/25 bg-primary/5 p-4 space-y-2">
          <div className="flex items-start gap-2 flex-wrap">
            <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground">Recommended Action</p>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border-2 border-black bg-primary text-primary-foreground">
                  {recommendation.channelLabel}
                </span>
                {stageConfig && (
                  <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border", stageConfig.badgeClass)}>
                    {recommendation.stageLabel}
                  </span>
                )}
                {recommendation.dueHint && (
                  <span className="text-[10px] text-muted-foreground">Due: {recommendation.dueHint}</span>
                )}
              </div>
              <p className="text-xs font-medium text-foreground mt-2">{recommendation.action}</p>
            </div>
          </div>
          <div className="text-[11px] leading-relaxed space-y-1 pl-6">
            <p>
              <span className="font-semibold text-foreground">Why now: </span>
              {recommendation.whyNow}
            </p>
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground/80">Why {recommendation.channelLabel.toLowerCase()}: </span>
              {recommendation.channelReason}
            </p>
          </div>
        </div>

        {/* Contact quick info */}
        <div className="flex flex-wrap gap-3 text-[11px]">
          {contactPhone && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-black/20 bg-muted/30">
              <Phone className="w-3 h-3" /> {contactPhone}
            </span>
          )}
          {contactEmail && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-black/20 bg-muted/30">
              <Mail className="w-3 h-3" /> {contactEmail}
            </span>
          )}
        </div>

        {/* Action tabs */}
        <div className="grid grid-cols-3 gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-center",
                activeTab === tab.id
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-black/12 hover:border-black/25 bg-white",
                isRecommended(tab.id) && activeTab !== tab.id && "ring-2 ring-primary/40 ring-offset-1"
              )}
            >
              {isRecommended(tab.id) && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.5 text-[8px] font-black uppercase bg-primary text-primary-foreground border border-black rounded whitespace-nowrap">
                  Recommended
                </span>
              )}
              <tab.icon className="w-4 h-4" />
              <span className="text-xs font-bold">{tab.label}</span>
            </button>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground">{tabs.find((t) => t.id === activeTab)?.desc}</p>

        <div className="space-y-3">
          <Input
            placeholder={
              activeTab === "call"
                ? "Call purpose (e.g. renewal check-in)"
                : activeTab === "message"
                  ? "Message topic (e.g. deployment follow-up)"
                  : "Email purpose (e.g. QBR invitation)"
            }
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="border-2 border-black text-sm"
          />

          {activeTab === "call" && (
            <Button
              onClick={handleCall}
              disabled={loading === "call"}
              className="w-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] gap-2"
            >
              {loading === "call" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
              Initiate Call
            </Button>
          )}

          {activeTab === "message" && (
            <>
              <Textarea
                placeholder="WhatsApp message preview..."
                value={messagePreview}
                onChange={(e) => setMessagePreview(e.target.value)}
                className="min-h-[100px] border-2 border-black resize-none text-sm"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleMessagePreview}
                  disabled={loading === "msg-preview"}
                  className="flex-1 border-2 border-black gap-2"
                >
                  {loading === "msg-preview" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Generate
                </Button>
                <Button
                  onClick={handleMessageSend}
                  disabled={loading === "msg-send"}
                  className="flex-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] gap-2"
                >
                  {loading === "msg-send" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send Message
                </Button>
              </div>
            </>
          )}

          {activeTab === "email" && (
            <>
              <Input
                placeholder="Email subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="border-2 border-black text-sm"
              />
              <Textarea
                placeholder="Email body..."
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="min-h-[100px] border-2 border-black resize-none text-sm"
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleEmailPreview}
                  disabled={loading === "email-preview"}
                  className="flex-1 border-2 border-black gap-2"
                >
                  {loading === "email-preview" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Generate
                </Button>
                <Button
                  onClick={handleEmailSend}
                  disabled={loading === "email-send"}
                  className="flex-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] gap-2"
                >
                  {loading === "email-send" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Send Mail
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
