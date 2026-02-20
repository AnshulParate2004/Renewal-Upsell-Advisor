import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, VolumeX, Sparkles, Phone, TrendingUp, RefreshCw, Shield, ArrowLeft, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { voicebotApi } from "@/lib/api/voicebot";

interface CallDemo {
  id: string;
  title: string;
  description: string;
  type: "renewal" | "upsell" | "wellness" | "churn_prevention" | "fallback";
  duration: string;
  icon: React.ReactNode;
  color: string;
}

const callDemos: CallDemo[] = [
  {
    id: "renewal-90",
    title: "Renewal Call - 90% Usage",
    description: "Bot calls customer at 90% contract completion to discuss renewal options",
    type: "renewal",
    duration: "2:34",
    icon: <RefreshCw className="w-5 h-5" />,
    color: "bg-blue-500"
  },
  {
    id: "renewal-95",
    title: "Urgent Renewal Call - 95% Usage",
    description: "Urgent renewal reminder when contract is 95% complete",
    type: "renewal",
    duration: "3:12",
    icon: <Shield className="w-5 h-5" />,
    color: "bg-red-500"
  },
  {
    id: "upsell-opportunity",
    title: "Upsell Opportunity Call",
    description: "Bot identifies upsell opportunity and calls to discuss expansion",
    type: "upsell",
    duration: "4:01",
    icon: <TrendingUp className="w-5 h-5" />,
    color: "bg-emerald-500"
  },
  {
    id: "wellness-check",
    title: "Wellness Check Call",
    description: "Regular check-in call to ensure customer satisfaction",
    type: "wellness",
    duration: "2:15",
    icon: <Phone className="w-5 h-5" />,
    color: "bg-purple-500"
  },
  {
    id: "churn-prevention",
    title: "Churn Prevention Call",
    description: "Bot calls high-risk account to address concerns and prevent churn",
    type: "churn_prevention",
    duration: "3:45",
    icon: <Shield className="w-5 h-5" />,
    color: "bg-amber-500"
  },
  {
    id: "fallback-call",
    title: "Fallback Call Example",
    description: "Reliable fallback script when LLM generation is unavailable",
    type: "fallback",
    duration: "1:58",
    icon: <Phone className="w-5 h-5" />,
    color: "bg-gray-500"
  }
];

export default function Demo() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [playingDemo, setPlayingDemo] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Initialize audio context and get greeting
  useEffect(() => {
    const initialize = async () => {
      try {
        // Get greeting audio
        const data = await voicebotApi.getGreetingAudio();
        
        if (data.audio_base64 && data.session_id) {
          setSessionId(data.session_id);
          // Play greeting audio
          if (!isMuted) {
            await playBase64Audio(data.audio_base64);
          }
        }
      } catch (error) {
        console.error("Failed to initialize:", error);
        toast({
          title: "Error",
          description: "Failed to initialize voice bot. Please check your microphone permissions.",
          variant: "destructive",
        });
      }
    };

    initialize();
  }, [toast, isMuted]);

  // WebSocket connection for real-time audio streaming
  useEffect(() => {
    if (!sessionId) return;

    const wsUrl = voicebotApi.getAudioWebSocketUrl();
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({
        type: "init",
        session_id: sessionId,
      }));
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "greeting" || data.type === "audio_response") {
          if (data.audio_base64 && !isMuted) {
            setIsSpeaking(true);
            await playBase64Audio(data.audio_base64);
            setIsSpeaking(false);
          }
        } else if (data.type === "error") {
          toast({
            title: "Error",
            description: data.message || "An error occurred",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Failed to process WebSocket message:", error);
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
  }, [sessionId, toast, isMuted]);

  // Play base64 audio
  const playBase64Audio = async (audioBase64: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const audioData = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
        const blob = new Blob([audioData], { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(blob);
        
        const audio = new Audio(audioUrl);
        audioElementRef.current = audio;
        
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        
        audio.onerror = (error) => {
          URL.revokeObjectURL(audioUrl);
          reject(error);
        };
        
        audio.play();
      } catch (error) {
        reject(error);
      }
    });
  };

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        // Convert audio chunks to base64
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          const base64Data = base64Audio.split(',')[1]; // Remove data:audio/webm;base64, prefix
          
          // Send audio via WebSocket
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: "audio",
              audio_base64: base64Data,
            }));
          } else {
            // Fallback to HTTP
            try {
              const data = await voicebotApi.processAudio(base64Data, sessionId || undefined);
              if (data.audio_base64 && !isMuted) {
                setIsSpeaking(true);
                await playBase64Audio(data.audio_base64);
                setIsSpeaking(false);
              }
            } catch (error) {
              console.error("Failed to process audio:", error);
              toast({
                title: "Error",
                description: "Failed to process audio. Please try again.",
                variant: "destructive",
              });
            }
          }
        };
        
        reader.readAsDataURL(audioBlob);
      };
      
      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsListening(true);
      
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast({
        title: "Microphone Error",
        description: "Please allow microphone access to use voice conversation.",
        variant: "destructive",
      });
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsListening(false);
  };

  // Toggle recording
  const handleToggleRecording = () => {
    if (isListening) {
      stopRecording();
    } else {
      if (isSpeaking) {
        // Stop current audio if speaking
        if (audioElementRef.current) {
          audioElementRef.current.pause();
          audioElementRef.current.currentTime = 0;
          setIsSpeaking(false);
        }
      }
      startRecording();
    }
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    if (audioElementRef.current && !isMuted) {
      audioElementRef.current.pause();
      setIsSpeaking(false);
    }
  };

  const handlePlayDemo = (demoId: string) => {
    if (playingDemo === demoId) {
      setPlayingDemo(null);
    } else {
      setPlayingDemo(demoId);
      // In real implementation, load and play actual audio file
      setTimeout(() => setPlayingDemo(null), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="p-6 pb-0">
        <div className="max-w-6xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 border-2 border-black hover:bg-muted"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span>Voice Bot Demo</span>
          </div>
        }
        description="Real-time voice conversation with AI-powered assistant"
      />

      <div className="p-6 space-y-8">
        {/* Real-time Voice Conversation */}
        <section>
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 text-center"
            >
              <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                <Phone className="w-6 h-6 text-primary" />
                Real-time Voice Conversation
              </h2>
              <p className="text-muted-foreground">
                Click the microphone to start talking. The bot will respond with voice.
              </p>
            </motion.div>

            <Card className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              {/* Status Display */}
              <div className="p-8">
                <div className="flex flex-col items-center justify-center space-y-6">
                  {/* Connection Status */}
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
                    <span className="text-sm text-muted-foreground">
                      {isConnected ? "Connected" : "Connecting..."}
                    </span>
                  </div>

                  {/* Voice Status Indicator */}
                  <div className="relative">
                    <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all ${
                      isListening 
                        ? "border-red-500 bg-red-50 animate-pulse" 
                        : isSpeaking 
                        ? "border-blue-500 bg-blue-50 animate-pulse"
                        : "border-gray-300 bg-muted"
                    }`}>
                      {isListening ? (
                        <MicOff className="w-16 h-16 text-red-500" />
                      ) : isSpeaking ? (
                        <Volume2 className="w-16 h-16 text-blue-500" />
                      ) : (
                        <Mic className="w-16 h-16 text-muted-foreground" />
                      )}
                    </div>
                    
                    {/* Ripple effect when active */}
                    {(isListening || isSpeaking) && (
                      <div className={`absolute inset-0 rounded-full border-4 animate-ping ${
                        isListening ? "border-red-500" : "border-blue-500"
                      }`} />
                    )}
                  </div>

                  {/* Status Text */}
                  <div className="text-center">
                    <p className="text-lg font-semibold mb-1">
                      {isListening 
                        ? "Listening..." 
                        : isSpeaking 
                        ? "Bot is speaking..." 
                        : "Ready to talk"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isListening 
                        ? "Speak now, release to send" 
                        : isSpeaking 
                        ? "Please wait..." 
                        : "Click microphone to start"}
                    </p>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={handleToggleRecording}
                      disabled={isSpeaking}
                      className={`h-16 w-16 rounded-full border-2 border-black ${
                        isListening 
                          ? "bg-red-500 text-white hover:bg-red-600" 
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {isListening ? (
                        <MicOff className="w-8 h-8" />
                      ) : (
                        <Mic className="w-8 h-8" />
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={handleMuteToggle}
                      className="h-12 w-12 rounded-full border-2 border-black"
                    >
                      {isMuted ? (
                        <VolumeX className="w-6 h-6" />
                      ) : (
                        <Volume2 className="w-6 h-6" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Pre-recorded Call Demos */}
        <section>
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Phone className="w-6 h-6 text-primary" />
                Pre-recorded Call Examples
              </h2>
              <p className="text-muted-foreground">
                Listen to real examples of our voice bot handling different scenarios
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {callDemos.map((demo, idx) => (
                <motion.div
                  key={demo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                  className="bg-card rounded-xl border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <div className={`w-12 h-12 ${demo.color} rounded-xl flex items-center justify-center mb-4 text-white`}>
                    {demo.icon}
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg">{demo.title}</h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {demo.duration}
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4">{demo.description}</p>
                  
                  <Button
                    onClick={() => handlePlayDemo(demo.id)}
                    className={`w-full border-2 border-black ${
                      playingDemo === demo.id
                        ? "bg-destructive text-destructive-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {playingDemo === demo.id ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Playing...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Play Demo
                      </>
                    )}
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
