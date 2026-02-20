import { useState, useEffect, useRef } from "react";
import { Bot, Mic, MicOff, Send, Loader2, Volume2, VolumeX, Sparkles } from "lucide-react";
import { voicebotApi } from "@/lib/api/voicebot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/ui/PageHeader";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isInterim?: boolean;
}

export default function VoiceBotDemo() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [interimTranscript, setInterimTranscript] = useState("");
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Initialize continuous voice recognition
  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      // Enable continuous recognition for seamless conversation
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = "en-US";
      recognitionInstance.maxAlternatives = 1;

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript + " ";
          } else {
            interim += transcript;
          }
        }

        if (interim) {
          setInterimTranscript(interim);
        }

        if (final.trim()) {
          setInterimTranscript("");
          handleVoiceMessage(final.trim());
        }
      };

      recognitionInstance.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        if (event.error !== "no-speech") {
          toast({
            title: "Voice recognition error",
            description: "Could not recognize speech. Please try again.",
            variant: "destructive",
          });
        }
      };

      recognitionInstance.onend = () => {
        if (isListening && recognitionInstance) {
          try {
            recognitionInstance.start();
          } catch (e) {
            // Already started or error
          }
        }
      };

      setRecognition(recognitionInstance);
    }
  }, [isListening, toast]);

  // Initialize greeting and session
  useEffect(() => {
    const initializeBot = async () => {
      try {
        const greeting = await voicebotApi.getGreeting();
        setSessionId(greeting.session_id);
        const greetingMessage: Message = {
          role: "assistant",
          content: greeting.greeting,
          timestamp: new Date().toISOString(),
        };
        setMessages([greetingMessage]);
        if (!isMuted) {
          speakText(greeting.greeting);
        }
      } catch (error) {
        console.error("Failed to initialize bot:", error);
        toast({
          title: "Error",
          description: "Failed to initialize voice bot. Please try again.",
          variant: "destructive",
        });
      }
    };

    initializeBot();
  }, [toast]);

  // WebSocket connection for real-time communication
  useEffect(() => {
    if (!sessionId) return;

    const wsUrl = voicebotApi.getWebSocketUrl();
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: "init",
        session_id: sessionId,
      }));
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "greeting" || data.type === "response") {
          const assistantMessage: Message = {
            role: "assistant",
            content: data.message,
            timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setIsLoading(false);
          
          if (!isMuted) {
            speakText(data.message);
          }
        } else if (data.type === "streaming") {
          setMessages((prev) => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage && lastMessage.role === "assistant" && lastMessage.isInterim) {
              return [...prev.slice(0, -1), {
                ...lastMessage,
                content: lastMessage.content + data.chunk,
              }];
            }
            return [...prev, {
              role: "assistant",
              content: data.chunk,
              timestamp: new Date().toISOString(),
              isInterim: true,
            }];
          });
        } else if (data.type === "stream_end") {
          setMessages((prev) => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage && lastMessage.isInterim) {
              const finalContent = lastMessage.content;
              if (!isMuted) {
                speakText(finalContent);
              }
              return [...prev.slice(0, -1), {
                ...lastMessage,
                isInterim: false,
              }];
            }
            return prev;
          });
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onerror = () => {
      setIsLoading(false);
    };

    ws.onclose = () => {
      // Reconnect logic could go here
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [sessionId, isMuted]);

  // Text-to-Speech function
  const speakText = (text: string) => {
    if (!synthRef.current || isMuted) return;
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = "en-US";

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const handleVoiceMessage = async (transcript: string) => {
    if (!transcript.trim() || !sessionId) return;

    const userMessage: Message = {
      role: "user",
      content: transcript,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    stopSpeaking();

    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "message",
          message: transcript,
        }));
      } else {
        const response = await voicebotApi.sendMessage({
          message: transcript,
          session_id: sessionId,
        });

        const assistantMessage: Message = {
          role: "assistant",
          content: response.response,
          timestamp: response.timestamp,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
        
        if (!isMuted) {
          speakText(response.response);
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !sessionId) return;
    await handleVoiceMessage(input.trim());
    setInput("");
  };

  const handleVoiceToggle = () => {
    if (!recognition) {
      toast({
        title: "Voice recognition not available",
        description: "Your browser doesn't support voice recognition.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      setInterimTranscript("");
    } else {
      stopSpeaking();
      recognition.start();
      setIsListening(true);
    }
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      stopSpeaking();
    }
  };

  const handleClear = async () => {
    if (!sessionId) return;

    stopSpeaking();
    setIsListening(false);
    if (recognition) {
      recognition.stop();
    }

    try {
      await voicebotApi.clearSession(sessionId);
      const greeting = await voicebotApi.getGreeting();
      setMessages([{
        role: "assistant",
        content: greeting.greeting,
        timestamp: new Date().toISOString(),
      }]);
      if (!isMuted) {
        speakText(greeting.greeting);
      }
    } catch (error) {
      console.error("Failed to clear session:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span>Voice Bot Demo</span>
          </div>
        }
        description="Experience continuous voice conversation with your Renewal & Upsell Advisor assistant"
      />

      <div className="p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Info Card */}
          <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary" />
                Demo Features
              </h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Continuous voice recognition - speak naturally without clicking</li>
                <li>• Real-time interim results - see what you're saying as you speak</li>
                <li>• Text-to-speech responses - bot speaks back to you</li>
                <li>• Low-latency WebSocket communication</li>
                <li>• Mute/unmute bot speech</li>
              </ul>
            </div>
          </Card>

          {/* Voice Bot Interface */}
          <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {/* Status Bar */}
            <div className="p-4 border-b-2 border-black bg-muted/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isListening ? "bg-red-500 animate-pulse" : isSpeaking ? "bg-blue-500 animate-pulse" : "bg-gray-400"}`} />
                <span className="text-xs text-muted-foreground">
                  {isListening ? "Listening..." : isSpeaking ? "Speaking..." : "Ready"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleMuteToggle}
                  className="h-8 w-8"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="h-[500px] p-6">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-black flex-shrink-0">
                        <Bot className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div
                      className={`max-w-[70%] rounded-lg p-4 border-2 border-black ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : message.isInterim
                          ? "bg-muted/50 opacity-70"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                    </div>
                    {message.role === "user" && (
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center border-2 border-black flex-shrink-0">
                        <span className="text-primary-foreground text-sm font-semibold">U</span>
                      </div>
                    )}
                  </div>
                ))}
                {interimTranscript && (
                  <div className="flex gap-3 justify-end">
                    <div className="max-w-[70%] rounded-lg p-4 border-2 border-black bg-primary/50 opacity-60">
                      <p className="text-sm italic">{interimTranscript}</p>
                    </div>
                  </div>
                )}
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-black">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div className="bg-muted rounded-lg p-4 border-2 border-black">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t-2 border-black bg-muted/50">
              <div className="flex gap-2 mb-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type your message or use voice input..."
                  className="flex-1 border-2 border-black"
                  disabled={isLoading || isListening}
                />
                <Button
                  variant={isListening ? "destructive" : "outline"}
                  size="icon"
                  onClick={handleVoiceToggle}
                  className="border-2 border-black"
                  disabled={!recognition || isLoading}
                >
                  {isListening ? (
                    <MicOff className="w-5 h-5" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading || isListening}
                  className="border-2 border-black"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="text-xs"
                >
                  Clear conversation
                </Button>
                <span className="text-xs text-muted-foreground">
                  {isListening && "Speak now..."}
                  {isSpeaking && "Bot is speaking..."}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
