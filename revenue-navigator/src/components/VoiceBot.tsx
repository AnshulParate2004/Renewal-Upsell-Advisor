import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Send, X, Bot, User, Loader2, Volume2, VolumeX } from "lucide-react";
import { voicebotApi } from "@/lib/api/voicebot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isInterim?: boolean;
}

interface VoiceBotProps {
  accountId?: string;
  onClose?: () => void;
}

export function VoiceBot({ accountId, onClose }: VoiceBotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [interimTranscript, setInterimTranscript] = useState("");
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
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
        const greeting = await voicebotApi.getGreeting(accountId);
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
  }, [accountId, toast]);

  // WebSocket connection for real-time communication
  useEffect(() => {
    if (!sessionId) return;

    const wsUrl = voicebotApi.getWebSocketUrl();
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({
        type: "init",
        session_id: sessionId,
        account_id: accountId,
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
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    ws.onerror = () => {
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [sessionId, accountId, isMuted]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, interimTranscript]);

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
          account_id: accountId,
        }));
      } else {
        const response = await voicebotApi.sendMessage({
          message: transcript,
          session_id: sessionId,
          account_id: accountId,
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
      const greeting = await voicebotApi.getGreeting(accountId);
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
    <Card className="fixed bottom-4 right-4 w-96 h-[600px] flex flex-col border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-black bg-primary/10">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-sm">Voice Assistant</h3>
          {isConnected && (
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMuteToggle}
            className="h-6 w-6"
          >
            {isMuted ? (
              <VolumeX className="w-3 h-3" />
            ) : (
              <Volume2 className="w-3 h-3" />
            )}
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="px-4 py-2 border-b border-black/20 bg-muted/30 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isListening ? "bg-red-500 animate-pulse" : isSpeaking ? "bg-blue-500 animate-pulse" : "bg-gray-400"}`} />
        <span className="text-xs text-muted-foreground">
          {isListening ? "Listening..." : isSpeaking ? "Speaking..." : "Ready"}
        </span>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-2 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border-2 border-black flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg p-3 border-2 border-black ${
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
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center border-2 border-black flex-shrink-0">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}
          {interimTranscript && (
            <div className="flex gap-2 justify-end">
              <div className="max-w-[80%] rounded-lg p-3 border-2 border-black bg-primary/50 opacity-60">
                <p className="text-sm italic">{interimTranscript}</p>
              </div>
            </div>
          )}
          {isLoading && (
            <div className="flex gap-2 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border-2 border-black">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-muted rounded-lg p-3 border-2 border-black">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t-2 border-black bg-muted/50">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type or speak..."
            className="flex-1 border-2 border-black text-sm"
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
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </Button>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || isListening}
            className="border-2 border-black"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="mt-2 text-xs"
        >
          Clear conversation
        </Button>
      </div>
    </Card>
  );
}
